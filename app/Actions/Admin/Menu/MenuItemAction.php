<?php

namespace App\Actions\Admin\Menu;

use App\Actions\Admin\Category\CategoryAction;
use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuItemAction
{
    public function __construct(
        private readonly MenuImageAction $imageAction,
        private readonly CategoryAction $categoryAction,
    ) {}

    public function create(array $data, ?UploadedFile $image = null, ?int $userId = null): MenuItem
    {
        return DB::transaction(function () use ($data, $image, $userId) {
            $sortOrder = $data['sort_order'] ?? null;

            if ($sortOrder === null) {
                MenuItem::increment('sort_order');
                $sortOrder = 1;
            }

            $categoryId = $this->normalizeCategoryId($data);
            $item = MenuItem::create([
                'menu_category_id' => $categoryId,
                'name' => $data['name'],
                'slug' => $this->generateUniqueSlug($data['name']),
                'base_price' => $data['base_price'],
                'promo_price' => $data['promo_price'] ?? null,
                'description' => $data['description'] ?? null,
                'min_order' => $data['min_order'] ?? 1,
                'is_recommended' => $data['is_recommended'] ?? false,
                'sort_order' => $sortOrder,
                'is_active' => $data['is_active'] ?? true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            if ($image) {
                $this->imageAction->upload(
                    file: $image,
                    menuItemId: $item->id,
                    isPrimary: true,
                );
            } else {
                $this->promoteTemporaryImages($data, $item->id);
            }

            return $item->refresh();
        });
    }

    public function update(MenuItem $item, array $data, ?UploadedFile $image = null, ?int $userId = null): MenuItem
    {
        return DB::transaction(function () use ($item, $data, $image, $userId) {
            $sortOrder = $data['sort_order'] ?? $item->sort_order;

            $categoryId = $this->normalizeCategoryId($data, $item);
            $item->update([
                'menu_category_id' => $categoryId,
                'name' => $data['name'] ?? $item->name,
                'base_price' => $data['base_price'] ?? $item->base_price,
                'promo_price' => array_key_exists('promo_price', $data) ? $data['promo_price'] : $item->promo_price,
                'description' => $data['description'] ?? $item->description,
                'min_order' => $data['min_order'] ?? $item->min_order,
                'is_recommended' => $data['is_recommended'] ?? $item->is_recommended,
                'sort_order' => $sortOrder,
                'is_active' => $data['is_active'] ?? $item->is_active,
                'updated_by' => $userId,
            ]);

            $this->deleteRemovedImages($data, $item);

            if ($image) {
                $this->imageAction->upload(
                    file: $image,
                    menuItemId: $item->id,
                    isPrimary: true,
                );
            } else {
                $this->promoteTemporaryImages($data, $item->id);
            }

            $this->setExistingPrimaryImage($data, $item);
            $this->ensurePrimaryImage($item);

            return $item->refresh();
        });
    }

    public function updateStatus(MenuItem $item, bool $isActive, ?int $userId = null): MenuItem
    {
        $item->update([
            'is_active' => $isActive,
            'updated_by' => $userId,
        ]);

        return $item->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function promoteTemporaryImages(array $data, int $menuItemId): void
    {
        $temporaryImageIds = collect($data['temporary_image_ids'] ?? [])
            ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
            ->values();

        if ($temporaryImageIds->isEmpty() && filled($data['temporary_image_id'] ?? null)) {
            $temporaryImageIds = collect([(string) $data['temporary_image_id']]);
        }

        if ($temporaryImageIds->isEmpty()) {
            return;
        }

        $primaryTemporaryImageId = filled($data['primary_temporary_image_id'] ?? null)
            ? (string) $data['primary_temporary_image_id']
            : (string) $temporaryImageIds->first();

        $temporaryImageIds->each(function (string $temporaryImageId) use ($menuItemId, $primaryTemporaryImageId): void {
            $this->imageAction->promoteTemporaryUpload(
                temporaryImageId: $temporaryImageId,
                menuItemId: $menuItemId,
                isPrimary: $temporaryImageId === $primaryTemporaryImageId,
            );
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function deleteRemovedImages(array $data, MenuItem $item): void
    {
        collect($data['removed_image_ids'] ?? [])
            ->filter(fn (mixed $id): bool => is_numeric($id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->each(function (int $imageId) use ($item): void {
                $image = $item->images()
                    ->whereKey($imageId)
                    ->first();

                if ($image instanceof MenuImage) {
                    $this->imageAction->delete($image);
                }
            });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function setExistingPrimaryImage(array $data, MenuItem $item): void
    {
        if (! filled($data['primary_image_id'] ?? null)) {
            return;
        }

        $image = $item->images()
            ->whereKey((int) $data['primary_image_id'])
            ->first();

        if ($image instanceof MenuImage) {
            $this->imageAction->setPrimary($image);
        }
    }

    private function ensurePrimaryImage(MenuItem $item): void
    {
        $hasPrimaryImage = $item->images()
            ->where('is_primary', true)
            ->exists();

        if ($hasPrimaryImage) {
            return;
        }

        $image = $item->images()
            ->orderBy('sort_order')
            ->first();

        if ($image instanceof MenuImage) {
            $this->imageAction->setPrimary($image);
        }
    }

    public function delete(MenuItem $item): void
    {
        DB::transaction(function () use ($item) {
            $item->load('images');
            $item->images->each(fn ($img) => $this->imageAction->delete($img));
            $item->delete();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function normalizeCategoryId(array $data, ?MenuItem $item = null): ?int
    {
        if (array_key_exists('menu_category_id', $data)) {
            $categoryId = filled($data['menu_category_id']) ? (int) $data['menu_category_id'] : null;

            if ($categoryId !== null && array_key_exists('menu_category_icon', $data)) {
                MenuCategory::query()->whereKey($categoryId)->update([
                    'icon' => $data['menu_category_icon'],
                ]);
                cache()->forget('menu_categories');
            }

            return $categoryId;
        }

        if (array_key_exists('menu_category_name', $data) && filled($data['menu_category_name'])) {
            return $this->categoryAction->findOrCreateMenuByName(
                (string) $data['menu_category_name'],
                isset($data['menu_category_icon']) ? (string) $data['menu_category_icon'] : null,
            )->id;
        }

        if (array_key_exists('menu_category_ids', $data)) {
            $categoryId = collect($data['menu_category_ids'])
                ->first(fn (mixed $id): bool => is_numeric($id) && (int) $id > 0);

            return $categoryId === null ? null : (int) $categoryId;
        }

        if (array_key_exists('menu_category_names', $data)) {
            $categoryName = collect($data['menu_category_names'])
                ->first(fn (mixed $name): bool => is_string($name) && trim($name) !== '');

            return $categoryName === null ? null : $this->categoryAction->findOrCreateMenuByName((string) $categoryName)->id;
        }

        return $item?->menu_category_id;
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (MenuItem::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
