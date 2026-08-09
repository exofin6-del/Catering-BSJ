<?php

namespace App\Actions\Menu;

use App\Actions\Category\CategoryAction;
use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MenuItemAction
{
    private const DefaultPerPage = 10;

    private const PerPageOptions = [10, 25, 50, 100];

    private const SortByOptions = [
        'manual',
        'name',
        'category',
        'min_order',
        'price',
        'status',
        'recommended',
        'promo',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        private readonly MenuImageAction $imageAction,
        private readonly CategoryAction $categoryAction,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function index(array $filters = []): LengthAwarePaginator
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return $this->applyIndexFilters($this->indexQuery(), $normalizedFilters)
            ->tap(fn (Builder $query): Builder => $this->applyIndexSort($query, $normalizedFilters))
            ->paginate($normalizedFilters['per_page'])
            ->withQueryString()
            ->through(fn (MenuItem $item): array => $this->serialize($item));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function export(array $filters = []): array
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return $this->applyIndexFilters($this->indexQuery(), $normalizedFilters)
            ->tap(fn (Builder $query): Builder => $this->applyIndexSort($query, $normalizedFilters))
            ->get()
            ->map(fn (MenuItem $item): array => $this->serialize($item))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{search: string, per_page: int, per_page_options: array<int, int>, category_id: int|null, status: string, recommended: string, promo: string, sort_by: string, sort_dir: string}
     */
    public function normalizeIndexFilters(array $filters = []): array
    {
        $perPage = (int) ($filters['per_page'] ?? self::DefaultPerPage);
        $sortBy = (string) ($filters['sort_by'] ?? 'manual');
        $sortDir = strtolower((string) ($filters['sort_dir'] ?? 'asc'));
        $status = (string) ($filters['status'] ?? 'all');
        $recommended = (string) ($filters['recommended'] ?? 'all');
        $promo = (string) ($filters['promo'] ?? 'all');

        if (! in_array($perPage, self::PerPageOptions, true)) {
            $perPage = self::DefaultPerPage;
        }

        if (! in_array($sortBy, self::SortByOptions, true)) {
            $sortBy = 'manual';
        }

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }

        if (! in_array($status, ['all', 'active', 'inactive'], true)) {
            $status = 'all';
        }

        if (! in_array($recommended, ['all', 'yes', 'no'], true)) {
            $recommended = 'all';
        }

        if (! in_array($promo, ['all', 'yes', 'no'], true)) {
            $promo = 'all';
        }

        $categoryId = filled($filters['category_id'] ?? null) && is_numeric($filters['category_id'])
            ? (int) $filters['category_id']
            : null;

        return [
            'search' => trim((string) ($filters['search'] ?? '')),
            'per_page' => $perPage,
            'per_page_options' => self::PerPageOptions,
            'category_id' => $categoryId !== null && $categoryId > 0 ? $categoryId : null,
            'status' => $status,
            'recommended' => $recommended,
            'promo' => $promo,
            'sort_by' => $sortBy,
            'sort_dir' => $sortDir,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function recentActivities(int $limit = 5): array
    {
        return MenuItem::query()
            ->select([
                'menu_items.id',
                'menu_items.name',
                'menu_items.slug',
                'menu_items.base_price',
                'menu_items.promo_price',
                'menu_items.description',
                'menu_items.min_order',
                'menu_items.is_recommended',
                'menu_items.sort_order',
                'menu_items.is_active',
                'menu_items.created_at',
                'menu_items.updated_at',
                'primary_images.image_url as primary_image_url',
            ])
            ->leftJoin('menu_images as primary_images', function (JoinClause $join): void {
                $join
                    ->on('primary_images.menu_item_id', '=', 'menu_items.id')
                    ->where('primary_images.is_primary', true);
            })
            ->orderByRaw('COALESCE(menu_items.updated_at, menu_items.created_at) DESC')
            ->orderByDesc('menu_items.id')
            ->limit($limit)
            ->get()
            ->map(fn (MenuItem $item): array => $this->serializeRecentActivity($item))
            ->values()
            ->all();
    }

    /**
     * @return array{total: int, active: int, recommended: int, uncategorized: int, promo: int}
     */
    public function stats(): array
    {
        $stats = MenuItem::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN is_recommended = 1 THEN 1 ELSE 0 END) as recommended')
            ->selectRaw('SUM(CASE WHEN menu_category_id IS NULL THEN 1 ELSE 0 END) as uncategorized')
            ->selectRaw('SUM(CASE WHEN promo_price IS NOT NULL THEN 1 ELSE 0 END) as promo')
            ->first();

        return [
            'total' => (int) ($stats?->total ?? 0),
            'active' => (int) ($stats?->active ?? 0),
            'recommended' => (int) ($stats?->recommended ?? 0),
            'uncategorized' => (int) ($stats?->uncategorized ?? 0),
            'promo' => (int) ($stats?->promo ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array{id: int, name: string, ordered_count: int}>
     */
    public function topOrderedItems(array $filters = [], int $limit = 4): array
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return $this->applyIndexFilters(MenuItem::query()
            ->select(['menu_items.id', 'menu_items.name'])
            ->selectRaw('COUNT(DISTINCT order_items.order_id) as ordered_count')
            ->leftJoin('menu_categories', 'menu_categories.id', '=', 'menu_items.menu_category_id')
            ->join('order_items', function (JoinClause $join): void {
                $join
                    ->on('order_items.menu_item_id', '=', 'menu_items.id')
                    ->where('order_items.item_type', 'menu_item');
            }), $normalizedFilters)
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('ordered_count')
            ->orderBy('menu_items.name')
            ->limit($limit)
            ->get()
            ->map(fn (MenuItem $item): array => [
                'id' => $item->id,
                'name' => $item->name,
                'ordered_count' => (int) ($item->ordered_count ?? 0),
            ])
            ->values()
            ->all();
    }

    public function serialize(MenuItem $item): array
    {
        $packageItemsCount = (int) ($item->package_items_count ?? $item->packageItems()->count());
        $orderItemsCount = (int) ($item->order_items_count ?? $item->orderItems()->count());
        $usageCount = $packageItemsCount + $orderItemsCount;

        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'base_price' => $item->base_price,
            'promo_price' => $item->promo_price,
            'description' => $item->description,
            'min_order' => $item->min_order,
            'is_recommended' => $item->is_recommended,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'created_at' => $item->created_at?->toISOString(),
            'updated_at' => $item->updated_at?->toISOString(),
            'creator' => $this->formatJoinedUser($item, 'creator_id', 'creator_name') ?? $this->formatUser($item->creator),
            'updater' => $this->formatJoinedUser($item, 'updater_id', 'updater_name') ?? $this->formatUser($item->updater),
            'primary_image' => $item->getAttribute('primary_image_url') ?? $item->primaryImage?->image_url,
            'images' => $this->formatImages($item->images),
            'menu_category' => $this->formatJoinedCategory($item) ?? $this->formatCategory($item->category),
            'package_items_count' => $packageItemsCount,
            'order_items_count' => $orderItemsCount,
            'usage_count' => $usageCount,
            'usage_label' => sprintf('%d paket', $packageItemsCount),
        ];
    }

    /**
     * @return Builder<MenuItem>
     */
    private function indexQuery(): Builder
    {
        return MenuItem::query()
            ->select([
                'menu_items.*',
                'menu_categories.id as joined_category_id',
                'menu_categories.name as joined_category_name',
                'creators.id as creator_id',
                'creators.name as creator_name',
                'updaters.id as updater_id',
                'updaters.name as updater_name',
                'primary_images.image_url as primary_image_url',
            ])
            ->leftJoin('menu_categories', 'menu_categories.id', '=', 'menu_items.menu_category_id')
            ->leftJoin('users as creators', 'creators.id', '=', 'menu_items.created_by')
            ->leftJoin('users as updaters', 'updaters.id', '=', 'menu_items.updated_by')
            ->leftJoin('menu_images as primary_images', function (JoinClause $join): void {
                $join
                    ->on('primary_images.menu_item_id', '=', 'menu_items.id')
                    ->where('primary_images.is_primary', true);
            })
            ->with([
                'images:id,menu_item_id,image_url,is_primary,sort_order',
            ]);
    }

    /**
     * @param  array{search: string, category_id: int|null, status: string, recommended: string, promo: string}  $filters
     * @return Builder<MenuItem>
     */
    private function applyIndexFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $search = $filters['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('menu_items.name', 'like', "%{$search}%")
                        ->orWhere('menu_items.description', 'like', "%{$search}%")
                        ->orWhere('menu_categories.name', 'like', "%{$search}%");
                });
            })
            ->when($filters['category_id'] !== null, function (Builder $query) use ($filters): void {
                $query->where('menu_items.menu_category_id', $filters['category_id']);
            })
            ->when($filters['status'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('menu_items.is_active', $filters['status'] === 'active');
            })
            ->when($filters['recommended'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('menu_items.is_recommended', $filters['recommended'] === 'yes');
            })
            ->when($filters['promo'] !== 'all', function (Builder $query) use ($filters): void {
                if ($filters['promo'] === 'yes') {
                    $query->whereNotNull('menu_items.promo_price');

                    return;
                }

                $query->whereNull('menu_items.promo_price');
            });
    }

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
     * @return array{id: string, name: string, url: string}
     */
    public function temporaryImage(UploadedFile $image): array
    {
        return $this->imageAction->temporaryUpload($image);
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

    public function reorder(array $ids): void
    {
        DB::transaction(function () use ($ids) {
            $updates = collect($ids)
                ->values()
                ->map(function (mixed $id, int $sortOrder): ?array {
                    if (! is_numeric($id)) {
                        return null;
                    }

                    return [
                        'id' => (int) $id,
                        'sort_order' => $sortOrder + 1,
                    ];
                })
                ->filter()
                ->values();

            if ($updates->isEmpty()) {
                return;
            }

            $grammar = DB::connection()->getQueryGrammar();
            $table = $grammar->wrapTable((new MenuItem)->getTable());
            $idColumn = $grammar->wrap('id');
            $sortOrderColumn = $grammar->wrap('sort_order');
            $updatedAtColumn = $grammar->wrap('updated_at');
            $timestamp = now()->toDateTimeString();
            $caseSql = $updates
                ->map(fn (): string => 'WHEN ? THEN ?')
                ->implode(' ');
            $caseBindings = $updates
                ->flatMap(fn (array $update): array => [$update['id'], $update['sort_order']])
                ->all();
            $updateIds = $updates
                ->pluck('id')
                ->all();
            $idPlaceholders = collect($updateIds)
                ->map(fn (): string => '?')
                ->implode(', ');

            DB::update(
                "UPDATE {$table} SET {$sortOrderColumn} = CASE {$idColumn} {$caseSql} ELSE {$sortOrderColumn} END, {$updatedAtColumn} = ? WHERE {$idColumn} IN ({$idPlaceholders})",
                [...$caseBindings, $timestamp, ...$updateIds],
            );
        });
    }

    public function moveToSortOrder(int $menuItemId, int $targetSortOrder): void
    {
        DB::transaction(function () use ($menuItemId, $targetSortOrder): void {
            $item = MenuItem::query()
                ->whereKey($menuItemId)
                ->lockForUpdate()
                ->firstOrFail();
            $currentSortOrder = (int) $item->sort_order;
            $targetSortOrder = max(1, $targetSortOrder);

            if ($targetSortOrder === $currentSortOrder) {
                return;
            }

            if ($targetSortOrder > $currentSortOrder) {
                MenuItem::query()
                    ->where('sort_order', '>', $currentSortOrder)
                    ->where('sort_order', '<=', $targetSortOrder)
                    ->decrement('sort_order');
            } else {
                MenuItem::query()
                    ->where('sort_order', '>=', $targetSortOrder)
                    ->where('sort_order', '<', $currentSortOrder)
                    ->increment('sort_order');
            }

            $item->update([
                'sort_order' => $targetSortOrder,
            ]);
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

    /**
     * @param  array{sort_by: string, sort_dir: string}  $filters
     */
    private function applyIndexSort(Builder $query, array $filters): Builder
    {
        $direction = $filters['sort_dir'];

        match ($filters['sort_by']) {
            'name' => $query->orderBy('menu_items.name', $direction),
            'category' => $query
                ->orderBy('menu_categories.name', $direction)
                ->orderBy('menu_items.name'),
            'price' => $query
                ->orderByRaw("COALESCE(menu_items.promo_price, menu_items.base_price) {$direction}")
                ->orderBy('menu_items.name'),
            'min_order' => $query
                ->orderBy('menu_items.min_order', $direction)
                ->orderBy('menu_items.name'),
            'status' => $query
                ->orderBy('menu_items.is_active', $direction)
                ->orderBy('menu_items.name'),
            'recommended' => $query
                ->orderBy('menu_items.is_recommended', $direction)
                ->orderBy('menu_items.name'),
            'promo' => $query
                ->orderByRaw("CASE WHEN menu_items.promo_price IS NULL THEN 0 ELSE 1 END {$direction}")
                ->orderBy('menu_items.name'),
            'created_at' => $query
                ->orderBy('menu_items.created_at', $direction)
                ->orderBy('menu_items.name'),
            'updated_at' => $query
                ->orderByRaw("COALESCE(menu_items.updated_at, menu_items.created_at) {$direction}")
                ->orderBy('menu_items.name'),
            default => $query
                ->orderBy('menu_items.sort_order', $direction)
                ->orderBy('menu_items.name'),
        };

        return $query;
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

    /**
     * @return array{id: int, name: string, icon: string|null}|null
     */
    private function formatCategory(?MenuCategory $category): ?array
    {
        return $category ? [
            'id' => $category->id,
            'name' => $category->name,
            'icon' => $category->icon,
        ] : null;
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private function formatJoinedCategory(MenuItem $item): ?array
    {
        $id = $item->getAttribute('joined_category_id');
        $name = $item->getAttribute('joined_category_name');

        if ($id === null || $name === null) {
            return null;
        }

        return [
            'id' => (int) $id,
            'name' => (string) $name,
        ];
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private function formatUser(?User $user): ?array
    {
        return $user ? ['id' => $user->id, 'name' => $user->name] : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRecentActivity(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'base_price' => $item->base_price,
            'promo_price' => $item->promo_price,
            'description' => $item->description,
            'min_order' => $item->min_order,
            'is_recommended' => $item->is_recommended,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'created_at' => $item->created_at?->toISOString(),
            'updated_at' => $item->updated_at?->toISOString(),
            'creator' => null,
            'updater' => null,
            'primary_image' => $item->getAttribute('primary_image_url'),
            'images' => [],
            'menu_category' => null,
        ];
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private function formatJoinedUser(MenuItem $item, string $idAttribute, string $nameAttribute): ?array
    {
        $id = $item->getAttribute($idAttribute);
        $name = $item->getAttribute($nameAttribute);

        if ($id === null || $name === null) {
            return null;
        }

        return [
            'id' => (int) $id,
            'name' => (string) $name,
        ];
    }

    /**
     * @return array<int, array{id: int, image_url: string, is_primary: bool, sort_order: int}>
     */
    private function formatImages($images): array
    {
        return $images
            ->sortBy('sort_order')
            ->map(fn (MenuImage $image): array => [
                'id' => $image->id,
                'image_url' => $image->image_url,
                'is_primary' => $image->is_primary,
                'sort_order' => $image->sort_order,
            ])
            ->values()
            ->all();
    }
}
