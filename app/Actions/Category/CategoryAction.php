<?php

namespace App\Actions\Category;

use App\Models\MenuCategory;
use App\Models\PackageCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class CategoryAction
{
    private const DefaultPerPage = 10;

    private const PerPageOptions = [10, 25, 50, 100];

    private const Types = ['all', 'menu', 'paket'];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function index(array $filters = []): LengthAwarePaginator
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);
        $categories = $this->indexCollection($normalizedFilters);

        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $perPage = $normalizedFilters['per_page'];

        return new LengthAwarePaginator(
            items: $categories->forPage($currentPage, $perPage)->values(),
            total: $categories->count(),
            perPage: $perPage,
            currentPage: $currentPage,
            options: [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
                'query' => request()->query(),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{search: string, per_page: int, per_page_options: array<int, int>, type: string, category_id: int|null}
     */
    public function normalizeIndexFilters(array $filters = []): array
    {
        $perPage = (int) ($filters['per_page'] ?? self::DefaultPerPage);
        $type = (string) ($filters['type'] ?? 'all');
        $categoryId = filled($filters['category_id'] ?? null) && is_numeric($filters['category_id'])
            ? (int) $filters['category_id']
            : null;

        if (! in_array($perPage, self::PerPageOptions, true)) {
            $perPage = self::DefaultPerPage;
        }

        if (! in_array($type, self::Types, true)) {
            $type = 'all';
        }

        if ($type === 'all' || ($categoryId !== null && $categoryId < 1)) {
            $categoryId = null;
        }

        return [
            'search' => trim((string) ($filters['search'] ?? '')),
            'per_page' => $perPage,
            'per_page_options' => self::PerPageOptions,
            'type' => $type,
            'category_id' => $categoryId,
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array{id: int, name: string, type: string}>
     */
    public function categoryOptions(array $filters = []): array
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return match ($normalizedFilters['type']) {
            'menu' => MenuCategory::query()
                ->ordered()
                ->get(['id', 'name'])
                ->map(fn (MenuCategory $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'type' => 'menu',
                ])
                ->all(),
            'paket' => PackageCategory::query()
                ->ordered()
                ->get(['id', 'name'])
                ->map(fn (PackageCategory $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'type' => 'paket',
                ])
                ->all(),
            default => [],
        };
    }

    /**
     * @param  array{name: string, icon?: string|null, is_active?: bool, type: string}  $data
     */
    public function create(array $data): array
    {
        $type = $this->validType($data['type']);

        if ($type === 'menu') {
            $category = DB::transaction(function () use ($data): MenuCategory {
                MenuCategory::query()->increment('sort_order');

                return MenuCategory::query()->create([
                    'name' => $data['name'],
                    'slug' => $this->generateUniqueMenuSlug($data['name']),
                    'icon' => $data['icon'] ?? null,
                    'sort_order' => 1,
                    'is_active' => $data['is_active'] ?? true,
                ]);
            });

            cache()->forget('menu_categories');

            return $this->serializeMenuCategory($category);
        }

        $category = DB::transaction(function () use ($data): PackageCategory {
            PackageCategory::query()->increment('sort_order');

            return PackageCategory::query()->create([
                'name' => $data['name'],
                'slug' => $this->generateUniquePackageSlug($data['name']),
                'icon' => $data['icon'] ?? null,
                'sort_order' => 1,
                'is_active' => $data['is_active'] ?? true,
            ]);
        });

        cache()->forget('package_categories');

        return $this->serializePackageCategory($category);
    }

    public function findOrCreateMenuByName(string $name, ?string $icon = null): MenuCategory
    {
        $name = trim($name);

        $category = MenuCategory::query()
            ->where('name', $name)
            ->first();

        if ($category instanceof MenuCategory) {
            return $category;
        }

        $createdCategory = DB::transaction(function () use ($name, $icon): MenuCategory {
            MenuCategory::query()->increment('sort_order');

            return MenuCategory::query()->create([
                'name' => $name,
                'slug' => $this->generateUniqueMenuSlug($name),
                'icon' => $icon,
                'sort_order' => 1,
                'is_active' => true,
            ]);
        });

        cache()->forget('menu_categories');

        return $createdCategory;
    }

    public function find(string $type, int $id): array
    {
        return match ($this->validType($type)) {
            'menu' => $this->serializeMenuCategory(MenuCategory::query()->findOrFail($id)),
            'paket' => $this->serializePackageCategory(PackageCategory::query()->findOrFail($id)),
        };
    }

    /**
     * @param  array{name: string, icon?: string|null, is_active?: bool}  $data
     */
    public function update(string $type, int $id, array $data): array
    {
        if ($this->validType($type) === 'menu') {
            $category = DB::transaction(function () use ($data, $id): MenuCategory {
                $category = MenuCategory::query()->findOrFail($id);
                $name = $data['name'] ?? $category->name;

                $category->update([
                    'name' => $name,
                    'slug' => $this->menuSlugForUpdate($name, $category),
                    'icon' => array_key_exists('icon', $data) ? $data['icon'] : $category->icon,
                    'is_active' => $data['is_active'] ?? $category->is_active,
                ]);

                return $category->refresh();
            });

            cache()->forget('menu_categories');

            return $this->serializeMenuCategory($category);
        }

        $category = DB::transaction(function () use ($data, $id): PackageCategory {
            $category = PackageCategory::query()->findOrFail($id);
            $name = $data['name'] ?? $category->name;

            $category->update([
                'name' => $name,
                'slug' => $this->packageSlugForUpdate($name, $category),
                'icon' => array_key_exists('icon', $data) ? $data['icon'] : $category->icon,
                'is_active' => $data['is_active'] ?? $category->is_active,
            ]);

            return $category->refresh();
        });

        cache()->forget('package_categories');

        return $this->serializePackageCategory($category);
    }

    public function updateStatus(string $type, int $id, bool $isActive): array
    {
        if ($this->validType($type) === 'menu') {
            $category = MenuCategory::query()->findOrFail($id);
            $category->update([
                'is_active' => $isActive,
            ]);

            cache()->forget('menu_categories');

            return $this->serializeMenuCategory($category->refresh());
        }

        $category = PackageCategory::query()->findOrFail($id);
        $category->update([
            'is_active' => $isActive,
        ]);

        cache()->forget('package_categories');

        return $this->serializePackageCategory($category->refresh());
    }

    public function delete(string $type, int $id): bool
    {
        if ($this->validType($type) === 'menu') {
            $category = MenuCategory::query()->findOrFail($id);

            if ($category->menuItems()->exists() || $category->packageItems()->exists()) {
                return false;
            }

            DB::transaction(function () use ($category): void {
                $category->delete();
            });

            cache()->forget('menu_categories');

            return true;
        }

        $category = PackageCategory::query()->findOrFail($id);

        if ($category->packages()->exists()) {
            return false;
        }

        $category->delete();
        cache()->forget('package_categories');

        return true;
    }

    public function moveToSortOrder(string $type, int $categoryId, int $targetSortOrder): void
    {
        if ($this->validType($type) === 'menu') {
            $this->moveMenuCategoryToSortOrder($categoryId, $targetSortOrder);
        } else {
            $this->movePackageCategoryToSortOrder($categoryId, $targetSortOrder);
        }
    }

    /**
     * @param  array<int, int>  $categoryIds
     */
    public function reorder(string $type, array $categoryIds): void
    {
        if ($this->validType($type) === 'menu') {
            MenuCategory::setNewOrder($categoryIds);
            cache()->forget('menu_categories');
        } else {
            PackageCategory::setNewOrder($categoryIds);
            cache()->forget('package_categories');
        }
    }

    private function moveMenuCategoryToSortOrder(int $categoryId, int $targetSortOrder): void
    {
        DB::transaction(function () use ($categoryId, $targetSortOrder): void {
            $category = MenuCategory::query()
                ->whereKey($categoryId)
                ->lockForUpdate()
                ->firstOrFail();
            $currentSortOrder = (int) $category->sort_order;
            $targetSortOrder = max(1, $targetSortOrder);

            if ($targetSortOrder === $currentSortOrder) {
                return;
            }

            if ($targetSortOrder > $currentSortOrder) {
                MenuCategory::query()
                    ->where('sort_order', '>', $currentSortOrder)
                    ->where('sort_order', '<=', $targetSortOrder)
                    ->decrement('sort_order');
            } else {
                MenuCategory::query()
                    ->where('sort_order', '>=', $targetSortOrder)
                    ->where('sort_order', '<', $currentSortOrder)
                    ->increment('sort_order');
            }

            $category->update(['sort_order' => $targetSortOrder]);
        });

        cache()->forget('menu_categories');
    }

    private function movePackageCategoryToSortOrder(int $categoryId, int $targetSortOrder): void
    {
        DB::transaction(function () use ($categoryId, $targetSortOrder): void {
            $category = PackageCategory::query()
                ->whereKey($categoryId)
                ->lockForUpdate()
                ->firstOrFail();
            $currentSortOrder = (int) $category->sort_order;
            $targetSortOrder = max(1, $targetSortOrder);

            if ($targetSortOrder === $currentSortOrder) {
                return;
            }

            if ($targetSortOrder > $currentSortOrder) {
                PackageCategory::query()
                    ->where('sort_order', '>', $currentSortOrder)
                    ->where('sort_order', '<=', $targetSortOrder)
                    ->decrement('sort_order');
            } else {
                PackageCategory::query()
                    ->where('sort_order', '>=', $targetSortOrder)
                    ->where('sort_order', '<', $currentSortOrder)
                    ->increment('sort_order');
            }

            $category->update(['sort_order' => $targetSortOrder]);
        });

        cache()->forget('package_categories');
    }

    /**
     * @param  array{search: string, type: string, category_id: int|null}  $filters
     * @return Collection<int, array<string, mixed>>
     */
    private function indexCollection(array $filters): Collection
    {
        $categories = collect();

        if (in_array($filters['type'], ['all', 'menu'], true)) {
            $categories = $categories->merge($this->menuIndex($filters['search'], $filters['category_id']));
        }

        if (in_array($filters['type'], ['all', 'paket'], true)) {
            $categories = $categories->merge($this->packageIndex($filters['search'], $filters['category_id']));
        }

        return $categories
            ->sortBy([
                ['type', 'asc'],
                ['sort_order', 'asc'],
                ['name', 'asc'],
            ])
            ->values();
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function menuIndex(string $search, ?int $categoryId = null): Collection
    {
        return MenuCategory::query()
            ->withCount(['menuItems', 'packageItems'])
            ->when($categoryId !== null, function (Builder $query) use ($categoryId): void {
                $query->whereKey($categoryId);
            })
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->ordered()
            ->get()
            ->map(fn (MenuCategory $category): array => $this->serializeMenuCategory($category));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function packageIndex(string $search, ?int $categoryId = null): Collection
    {
        return PackageCategory::query()
            ->withCount('packages')
            ->when($categoryId !== null, function (Builder $query) use ($categoryId): void {
                $query->whereKey($categoryId);
            })
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%");
                });
            })
            ->ordered()
            ->get()
            ->map(fn (PackageCategory $category): array => $this->serializePackageCategory($category));
    }

    /**
     * @return array{id: int, key: string, type: string, type_label: string, name: string, slug: string, icon: string|null, is_active: bool, sort_order: int, menu_items_count: int, package_items_count: int, packages_count: int, usage_count: int, usage_label: string, created_at: string|null, updated_at: string|null}
     */
    private function serializeMenuCategory(MenuCategory $category): array
    {
        $menuItemsCount = (int) ($category->menu_items_count ?? 0);
        $packageItemsCount = (int) ($category->package_items_count ?? 0);

        return [
            'id' => $category->id,
            'key' => "menu:{$category->id}",
            'type' => 'menu',
            'type_label' => 'Menu',
            'name' => $category->name,
            'slug' => $category->slug,
            'icon' => $category->icon,
            'is_active' => $category->is_active,
            'sort_order' => $category->sort_order,
            'menu_items_count' => $menuItemsCount,
            'package_items_count' => $packageItemsCount,
            'packages_count' => 0,
            'usage_count' => $menuItemsCount + $packageItemsCount,
            'usage_label' => "{$menuItemsCount} menu",
            'created_at' => $category->created_at?->toISOString(),
            'updated_at' => $category->updated_at?->toISOString(),
        ];
    }

    /**
     * @return array{id: int, key: string, type: string, type_label: string, name: string, slug: string, icon: string|null, is_active: bool, sort_order: int, menu_items_count: int, package_items_count: int, packages_count: int, usage_count: int, usage_label: string, created_at: string|null, updated_at: string|null}
     */
    private function serializePackageCategory(PackageCategory $category): array
    {
        $packagesCount = (int) ($category->packages_count ?? 0);

        return [
            'id' => $category->id,
            'key' => "paket:{$category->id}",
            'type' => 'paket',
            'type_label' => 'Paket',
            'name' => $category->name,
            'slug' => $category->slug,
            'icon' => $category->icon,
            'is_active' => $category->is_active,
            'sort_order' => $category->sort_order,
            'menu_items_count' => 0,
            'package_items_count' => 0,
            'packages_count' => $packagesCount,
            'usage_count' => $packagesCount,
            'usage_label' => "{$packagesCount} paket",
            'created_at' => $category->created_at?->toISOString(),
            'updated_at' => $category->updated_at?->toISOString(),
        ];
    }

    private function validType(string $type): string
    {
        if (! in_array($type, ['menu', 'paket'], true)) {
            throw new InvalidArgumentException("Unsupported category type [{$type}].");
        }

        return $type;
    }

    private function nextPackageSortOrder(): int
    {
        return ((int) PackageCategory::query()->max('sort_order')) + 1;
    }

    private function nextMenuSortOrder(): int
    {
        return ((int) MenuCategory::query()->max('sort_order')) + 1;
    }

    private function generateUniqueMenuSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (MenuCategory::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function generateUniquePackageSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (PackageCategory::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function menuSlugForUpdate(string $name, MenuCategory $category): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === $category->slug) {
            return $category->slug;
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            MenuCategory::query()
                ->where('slug', $slug)
                ->whereKeyNot($category->id)
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }

    private function packageSlugForUpdate(string $name, PackageCategory $category): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === $category->slug) {
            return $category->slug;
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (
            PackageCategory::query()
                ->where('slug', $slug)
                ->whereKeyNot($category->id)
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
