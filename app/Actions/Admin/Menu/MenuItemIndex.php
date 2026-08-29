<?php

namespace App\Actions\Admin\Menu;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Pagination\LengthAwarePaginator;

class MenuItemIndex
{
    public function __construct(
        private readonly MenuItemFilters $filters,
    ) {}

    private const DEFAULT_PER_PAGE = 10;

    private const PER_PAGE_OPTIONS = [
        10,
        25,
        50,
        100,
    ];

    private const SORT_BY_OPTIONS = [
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

    /**
     * Daftar menu item terpaginasi siap konsumsi frontend.
     *
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function handle(array $filters): LengthAwarePaginator
    {
        $query = $this->filteredQuery($filters);

        $this->applySorting($query, $filters);

        return $query
            ->paginate(
                $this->resolvePerPage($filters['per_page'] ?? null)
            )
            ->withQueryString()
            ->through(fn (MenuItem $menuItem): array => $this->serialize($menuItem));
    }

    /**
     * Versi tanpa paginasi untuk endpoint export.
     *
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function listAll(array $filters): array
    {
        $query = $this->filteredQuery($filters);

        $this->applySorting($query, $filters);

        return $query
            ->get()
            ->map(fn (MenuItem $menuItem): array => $this->serialize($menuItem))
            ->values()
            ->all();
    }

    /**
     * Menu item paling sering dipesan (menyaring pakai filter index).
     *
     * @param  array<string, mixed>  $filters
     * @return array<int, array{id: int, name: string, ordered_count: int}>
     */
    public function topOrderedItems(
        array $filters,
        int $limit = 4,
    ): array {
        return $this->filteredQuery($filters)
            ->select([
                'menu_items.id',
                'menu_items.name',
            ])
            ->selectRaw('COUNT(DISTINCT order_items.order_id) as ordered_count')
            ->join('order_items', function (JoinClause $join): void {
                $join
                    ->on('order_items.menu_item_id', '=', 'menu_items.id')
                    ->where('order_items.item_type', 'menu_item');
            })
            ->groupBy('menu_items.id', 'menu_items.name')
            ->orderByDesc('ordered_count')
            ->orderBy('menu_items.name')
            ->limit($limit)
            ->get()
            ->map(fn (MenuItem $menuItem): array => [
                'id' => $menuItem->id,
                'name' => $menuItem->name,
                'ordered_count' => (int) ($menuItem->ordered_count ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * Serialisasi satu menu item untuk halaman show/edit
     * maupun baris index.
     *
     * @return array<string, mixed>
     */
    public function serialize(MenuItem $menuItem): array
    {
        $packageItemsCount = (int) (
            $menuItem->package_items_count
            ?? $menuItem->packageItems()->count()
        );

        $orderItemsCount = (int) (
            $menuItem->order_items_count
            ?? $menuItem->orderItems()->count()
        );

        return [
            'id' => $menuItem->id,
            'name' => $menuItem->name,
            'slug' => $menuItem->slug,
            'base_price' => $menuItem->base_price,
            'promo_price' => $menuItem->promo_price,
            'description' => $menuItem->description,
            'min_order' => $menuItem->min_order,
            'is_recommended' => $menuItem->is_recommended,
            'sort_order' => $menuItem->sort_order,
            'is_active' => $menuItem->is_active,
            'created_at' => $menuItem->created_at?->toISOString(),
            'updated_at' => $menuItem->updated_at?->toISOString(),
            'creator' => $this->joinedUser($menuItem, 'creator_id', 'creator_name')
                ?? $this->simpleUser($menuItem->creator),
            'updater' => $this->joinedUser($menuItem, 'updater_id', 'updater_name')
                ?? $this->simpleUser($menuItem->updater),
            'primary_image' => $menuItem->getAttribute('primary_image_url')
                ?? $menuItem->primaryImage?->image_url,
            'images' => $this->images($menuItem->images),
            'menu_category' => $this->joinedCategory($menuItem)
                ?? $this->category($menuItem->category),
            'package_items_count' => $packageItemsCount,
            'order_items_count' => $orderItemsCount,
            'usage_count' => $packageItemsCount + $orderItemsCount,
            'usage_label' => sprintf('%d paket', $packageItemsCount),
        ];
    }

    /**
     * Query dasar lengkap dengan join relasi pendukung payload.
     *
     * @return Builder<MenuItem>
     */
    private function baseQuery(): Builder
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
            ->leftJoin(
                'menu_categories',
                'menu_categories.id',
                '=',
                'menu_items.menu_category_id'
            )
            ->leftJoin('users as creators', 'creators.id', '=', 'menu_items.created_by')
            ->leftJoin('users as updaters', 'updaters.id', '=', 'menu_items.updated_by')
            ->leftJoin('menu_images as primary_images', function (JoinClause $join): void {
                $join
                    ->on('primary_images.menu_item_id', '=', 'menu_items.id')
                    ->where('primary_images.is_primary', true);
            })
            ->with([
                'images:id,menu_item_id,image_url,is_primary,sort_order',
            ])
            ->withCount([
                'packageItems',
                'orderItems',
            ]);
    }

    /**
     * Terapkan filter ter-normalisasi pada query dasar.
     *
     * @param  array<string, mixed>  $filters
     * @return Builder<MenuItem>
     */
    private function filteredQuery(array $filters): Builder
    {
        $query = $this->baseQuery();

        $this->filters->apply($query, $filters);

        return $query;
    }

    /**
     * Urutan hasil sesuai pilihan user, dengan tie-breaker nama.
     *
     * @param  array<string, mixed>  $filters
     */
    private function applySorting(
        Builder $query,
        array $filters,
    ): void {
        $sortBy = $filters['sort_by'] ?? 'manual';

        $sortDir = ($filters['sort_dir'] ?? null) === 'desc'
            ? 'desc'
            : 'asc';

        if (! in_array($sortBy, self::SORT_BY_OPTIONS, true)) {
            $sortBy = 'manual';
        }

        match ($sortBy) {
            'name' => $query->orderBy(
                'menu_items.name',
                $sortDir
            ),

            'category' => $query->orderBy(
                'menu_categories.name',
                $sortDir
            ),

            'price' => $query->orderByRaw(
                "COALESCE(menu_items.promo_price, menu_items.base_price) {$sortDir}"
            ),

            'min_order' => $query->orderBy(
                'menu_items.min_order',
                $sortDir
            ),

            'status' => $query->orderBy(
                'menu_items.is_active',
                $sortDir
            ),

            'recommended' => $query->orderBy(
                'menu_items.is_recommended',
                $sortDir
            ),

            'promo' => $query->orderByRaw(
                "CASE WHEN menu_items.promo_price IS NULL THEN 0 ELSE 1 END {$sortDir}"
            ),

            'created_at' => $query->orderBy(
                'menu_items.created_at',
                $sortDir
            ),

            'updated_at' => $query->orderByRaw(
                "COALESCE(menu_items.updated_at, menu_items.created_at) {$sortDir}"
            ),

            default => $query->orderBy(
                'menu_items.sort_order',
                $sortDir
            ),
        };

        // Menjaga urutan pagination tetap stabil
        $query->orderBy('menu_items.name');
    }

    private function resolvePerPage(mixed $perPage): int
    {
        $perPage = (int) $perPage;

        return in_array(
            $perPage,
            self::PER_PAGE_OPTIONS,
            true
        )
            ? $perPage
            : self::DEFAULT_PER_PAGE;
    }

    /**
     * @return array{id: int, name: string, icon: string}|null
     */
    private function category(?MenuCategory $menuCategory): ?array
    {
        if ($menuCategory === null) {
            return null;
        }

        return [
            'id' => $menuCategory->id,
            'name' => $menuCategory->name,
            'icon' => $menuCategory->icon,
        ];
    }

    /**
     * Kategori hasil join pada query index.
     *
     * @return array{id: int, name: string}|null
     */
    private function joinedCategory(MenuItem $menuItem): ?array
    {
        $id = $menuItem->getAttribute('joined_category_id');
        $name = $menuItem->getAttribute('joined_category_name');

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
    private function simpleUser(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
        ];
    }

    /**
     * User hasil join pada query index.
     *
     * @return array{id: int, name: string}|null
     */
    private function joinedUser(
        MenuItem $menuItem,
        string $idAttribute,
        string $nameAttribute,
    ): ?array {
        $id = $menuItem->getAttribute($idAttribute);
        $name = $menuItem->getAttribute($nameAttribute);

        if ($id === null || $name === null) {
            return null;
        }

        return [
            'id' => (int) $id,
            'name' => (string) $name,
        ];
    }

    /**
     * @param  iterable<int, MenuImage>  $images
     * @return array<int, array{id: int, image_url: string, is_primary: bool, sort_order: int}>
     */
    private function images(iterable $images): array
    {
        return collect($images)
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
