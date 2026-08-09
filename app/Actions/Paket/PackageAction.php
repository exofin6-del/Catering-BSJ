<?php

namespace App\Actions\Paket;

use App\Models\MenuItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\PackageImage;
use App\Models\PackageItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PackageAction
{
    private const DefaultPerPage = 10;

    private const PerPageOptions = [10, 25, 50, 100];

    private const DefaultPackageRecommendation = false;

    private const SortByOptions = [
        'manual',
        'category',
        'name',
        'price',
        'min_order',
        'status',
        'recommended',
        'promo',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        private readonly PackageImageAction $imageAction,
    ) {}

    /**
     * @return array<int, array<string, mixed>>
     */
    public function packages(): array
    {
        return Package::query()
            ->with($this->packageRelations())
            ->ordered()
            ->get([
                'id',
                'package_category_id',
                'name',
                'slug',
                'price',
                'min_order',
                'description',
                'is_recommended',
                'sort_order',
                'is_active',
                'created_by',
                'updated_by',
                'created_at',
                'updated_at',
            ])
            ->map(fn (Package $package): array => $this->serialize($package))
            ->values()
            ->all();
    }

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
            ->through(fn (Package $package): array => $this->serialize($package));
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
            ->map(fn (Package $package): array => $this->serialize($package))
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
        return $this->indexQuery()
            ->orderByRaw('COALESCE(packages.updated_at, packages.created_at) DESC')
            ->orderByDesc('packages.id')
            ->limit($limit)
            ->get()
            ->map(fn (Package $package): array => $this->serialize($package))
            ->values()
            ->all();
    }

    /**
     * @return array{total: int, active: int, recommended: int, promo: int}
     */
    public function stats(): array
    {
        $stats = Package::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN is_recommended = 1 THEN 1 ELSE 0 END) as recommended')
            ->selectRaw('SUM(CASE WHEN '.$this->packageCustomPriceExistsSql().' THEN 1 ELSE 0 END) as promo')
            ->first();

        return [
            'total' => (int) ($stats?->total ?? 0),
            'active' => (int) ($stats?->active ?? 0),
            'recommended' => (int) ($stats?->recommended ?? 0),
            'promo' => (int) ($stats?->promo ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array{id: int, name: string, ordered_count: int}>
     */
    public function topOrderedPackages(array $filters = [], int $limit = 4): array
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return $this->applyIndexFilters(Package::query()
            ->select(['packages.id', 'packages.name'])
            ->selectRaw('COUNT(DISTINCT order_items.order_id) as ordered_count')
            ->leftJoin('package_categories', 'package_categories.id', '=', 'packages.package_category_id')
            ->join('order_items', function (JoinClause $join): void {
                $join
                    ->on('order_items.package_id', '=', 'packages.id')
                    ->where('order_items.item_type', 'package');
            }), $normalizedFilters)
            ->groupBy('packages.id', 'packages.name')
            ->orderByDesc('ordered_count')
            ->orderBy('packages.name')
            ->limit($limit)
            ->get()
            ->map(fn (Package $package): array => [
                'id' => $package->id,
                'name' => $package->name,
                'ordered_count' => (int) ($package->ordered_count ?? 0),
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function menuItemsForCommand(): array
    {
        return MenuItem::query()
            ->with([
                'category:id,name',
                'primaryImage:id,menu_item_id,image_url',
            ])
            ->active()
            ->ordered()
            ->get([
                'id',
                'menu_category_id',
                'name',
                'slug',
                'base_price',
                'promo_price',
                'min_order',
                'is_recommended',
                'sort_order',
                'is_active',
            ])
            ->map(fn (MenuItem $item): array => [
                'id' => $item->id,
                'menu_category_id' => $item->menu_category_id,
                'name' => $item->name,
                'slug' => $item->slug,
                'base_price' => $item->base_price,
                'promo_price' => $item->promo_price,
                'min_order' => $item->min_order,
                'is_recommended' => $item->is_recommended,
                'is_active' => $item->is_active,
                'primary_image' => $item->primaryImage?->image_url,
                'menu_category' => $item->category ? [
                    'id' => $item->category->id,
                    'name' => $item->category->name,
                ] : null,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string, icon: string|null}>
     */
    public function categoriesForCommand(): array
    {
        return PackageCategory::query()
            ->active()
            ->ordered()
            ->get(['id', 'name', 'icon'])
            ->map(fn (PackageCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'icon' => $category->icon,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(Package $package): array
    {
        $package->loadMissing($this->packageRelations());

        $items = $package->items
            ->map(fn (PackageItem $packageItem): array => [
                'id' => $packageItem->id,
                'name' => $packageItem->name,
                'menu_item_id' => $packageItem->menu_item_id,
                'menu_category_id' => $packageItem->menu_category_id,
                'package_price' => $packageItem->package_price,
                'is_recommended' => $packageItem->is_recommended,
                'min_select' => $packageItem->min_select,
                'max_select' => $packageItem->max_select,
                'sort_order' => $packageItem->sort_order,
                'menu_item' => $this->serializeMenuItem($packageItem->menuItem),
                'menu_category' => $packageItem->menuCategory ? [
                    'id' => $packageItem->menuCategory->id,
                    'name' => $packageItem->menuCategory->name,
                ] : null,
                'item_prices' => $packageItem->prices
                    ->map(fn ($itemPrice): array => [
                        'id' => $itemPrice->id,
                        'menu_item_id' => $itemPrice->menu_item_id,
                        'package_price' => $itemPrice->package_price,
                        'is_recommended' => $itemPrice->is_recommended,
                        'menu_item' => $this->serializeMenuItem($itemPrice->menuItem),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        $images = $package->images
            ->sortBy('sort_order')
            ->map(fn (PackageImage $image): array => [
                'id' => $image->id,
                'image_url' => $image->image_url,
                'is_primary' => $image->is_primary,
                'sort_order' => $image->sort_order,
            ])
            ->values()
            ->all();

        return [
            'id' => $package->id,
            'package_category_id' => $package->package_category_id,
            'name' => $package->name,
            'slug' => $package->slug,
            'price' => $package->price,
            'min_order' => $package->min_order,
            'description' => $package->description,
            'primary_image' => $package->getAttribute('primary_image_url') ?? $package->primaryImage?->image_url,
            'images' => $images,
            'is_recommended' => $package->is_recommended,
            'sort_order' => $package->sort_order,
            'is_active' => $package->is_active,
            'created_at' => $package->created_at?->toISOString(),
            'updated_at' => $package->updated_at?->toISOString(),
            'creator' => $this->formatJoinedUser($package, 'creator_id', 'creator_name') ?? $this->formatUser($package->creator),
            'updater' => $this->formatJoinedUser($package, 'updater_id', 'updater_name') ?? $this->formatUser($package->updater),
            'package_category' => $package->category ? [
                'id' => $package->category->id,
                'name' => $package->category->name,
                'icon' => $package->category->icon,
            ] : null,
            'menu_item_ids' => collect($items)
                ->flatMap(function (array $item): array {
                    return collect([
                        $item['menu_item_id'] ?? null,
                        ...collect($item['item_prices'] ?? [])->pluck('menu_item_id')->all(),
                    ])->filter()->map(fn (mixed $id): int => (int) $id)->all();
                })
                ->filter()
                ->unique()
                ->values()
                ->all(),
            'items_count' => count($items),
            'items' => $items,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?int $userId = null): Package
    {
        return DB::transaction(function () use ($data, $userId): Package {
            $menuItemIds = $this->menuItemIdsForPayload($data);
            $menuItems = $this->menuItemsForIds($menuItemIds);

            $sortOrder = $data['sort_order'] ?? null;

            if ($sortOrder === null) {
                Package::query()->increment('sort_order');
                $sortOrder = 1;
            }

            $package = Package::create([
                'package_category_id' => $this->normalizeCategoryId($data),
                'name' => $data['name'],
                'slug' => $this->generateUniqueSlug($data['name']),
                'price' => $this->packagePrice($data, $menuItemIds, $menuItems),
                'min_order' => $data['min_order'] ?? 1,
                'description' => $data['description'] ?? null,
                'is_recommended' => $data['is_recommended'] ?? false,
                'sort_order' => $sortOrder,
                'is_active' => $data['is_active'] ?? true,
                'created_by' => $userId,
                'updated_by' => $userId,
            ]);

            $this->createPackageItems($package, $menuItems, $data);
            $this->promoteTemporaryImages($data, $package->id);
            $this->ensurePrimaryImage($package);

            return $package->refresh()->load($this->packageRelations());
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Package $package, array $data, ?int $userId = null): Package
    {
        return DB::transaction(function () use ($package, $data, $userId): Package {
            $hasPackageItems = array_key_exists('package_components', $data);
            $menuItemIds = $hasPackageItems ? $this->menuItemIdsForPayload($data) : [];
            $menuItems = $hasPackageItems ? $this->menuItemsForIds($menuItemIds) : collect();

            $package->update([
                'package_category_id' => $this->normalizeCategoryId($data, $package),
                'name' => $this->value($data, 'name', $package->name),
                'price' => $this->updatedPackagePrice($data, $package, $menuItemIds, $menuItems),
                'min_order' => $this->value($data, 'min_order', $package->min_order),
                'description' => $this->value($data, 'description', $package->description),
                'is_recommended' => $this->value($data, 'is_recommended', $package->is_recommended),
                'sort_order' => $this->value($data, 'sort_order', $package->sort_order),
                'is_active' => $this->value($data, 'is_active', $package->is_active),
                'updated_by' => $userId,
            ]);

            if ($hasPackageItems) {
                $package->items()->delete();
                $this->createPackageItems($package, $menuItems, $data);
            }

            $this->deleteRemovedImages($data, $package);
            $this->promoteTemporaryImages($data, $package->id);
            $this->setExistingPrimaryImage($data, $package);
            $this->ensurePrimaryImage($package);

            return $package->refresh()->load($this->packageRelations());
        });
    }

    public function updateStatus(Package $package, bool $isActive, ?int $userId = null): Package
    {
        $package->update([
            'is_active' => $isActive,
            'updated_by' => $userId,
        ]);

        return $package->refresh();
    }

    public function delete(Package $package): void
    {
        DB::transaction(function () use ($package): void {
            $package->load('images');
            $package->images->each(function (PackageImage $image): void {
                $this->imageAction->delete($image);
            });
            $package->delete();
        });
    }

    /**
     * @param  array<int, int>  $ids
     */
    public function reorder(array $ids): void
    {
        DB::transaction(function () use ($ids): void {
            foreach ($ids as $sortOrder => $id) {
                Package::query()
                    ->whereKey($id)
                    ->update([
                        'sort_order' => $sortOrder + 1,
                    ]);
            }
        });
    }

    public function moveToSortOrder(int $packageId, int $targetSortOrder): void
    {
        DB::transaction(function () use ($packageId, $targetSortOrder): void {
            $package = Package::query()
                ->whereKey($packageId)
                ->lockForUpdate()
                ->firstOrFail();
            $currentSortOrder = (int) $package->sort_order;
            $targetSortOrder = max(1, $targetSortOrder);

            if ($targetSortOrder === $currentSortOrder) {
                return;
            }

            if ($targetSortOrder > $currentSortOrder) {
                Package::query()
                    ->where('sort_order', '>', $currentSortOrder)
                    ->where('sort_order', '<=', $targetSortOrder)
                    ->decrement('sort_order');
            } else {
                Package::query()
                    ->where('sort_order', '>=', $targetSortOrder)
                    ->where('sort_order', '<', $currentSortOrder)
                    ->increment('sort_order');
            }

            $package->update([
                'sort_order' => $targetSortOrder,
            ]);
        });
    }

    /**
     * @return array{id: string, name: string, url: string}
     */
    public function temporaryImage(UploadedFile $image): array
    {
        return $this->imageAction->temporaryUpload($image);
    }

    /**
     * @return Builder<Package>
     */
    private function indexQuery(): Builder
    {
        return Package::query()
            ->select([
                'packages.*',
                'creators.id as creator_id',
                'creators.name as creator_name',
                'updaters.id as updater_id',
                'updaters.name as updater_name',
                'primary_images.image_url as primary_image_url',
            ])
            ->leftJoin('package_categories', 'package_categories.id', '=', 'packages.package_category_id')
            ->leftJoin('users as creators', 'creators.id', '=', 'packages.created_by')
            ->leftJoin('users as updaters', 'updaters.id', '=', 'packages.updated_by')
            ->leftJoin('package_images as primary_images', function (JoinClause $join): void {
                $join
                    ->on('primary_images.package_id', '=', 'packages.id')
                    ->where('primary_images.is_primary', true);
            })
            ->with($this->packageRelations());
    }

    /**
     * @return array<string, mixed>
     */
    private function packageRelations(): array
    {
        return [
            'category:id,name,icon',
            'creator:id,name',
            'images:id,package_id,image_url,is_primary,sort_order',
            'primaryImage:id,package_id,image_url',
            'updater:id,name',
            'items' => fn (HasMany $query) => $query
                ->select([
                    'id',
                    'package_id',
                    'name',
                    'menu_item_id',
                    'menu_category_id',
                    'is_recommended',
                    'package_price',
                    'min_select',
                    'max_select',
                    'sort_order',
                ])
                ->orderBy('sort_order')
                ->orderBy('id'),
            'items.menuItem:id,menu_category_id,name,slug,base_price,promo_price,min_order,is_recommended,is_active',
            'items.menuItem.category:id,name',
            'items.menuItem.primaryImage:id,menu_item_id,image_url',
            'items.menuCategory:id,name',
            'items.prices' => fn (HasMany $query) => $query
                ->select(['id', 'package_item_id', 'menu_item_id', 'package_price', 'is_recommended'])
                ->orderBy('id'),
            'items.prices.menuItem:id,menu_category_id,name,slug,base_price,promo_price,min_order,is_recommended,is_active',
            'items.prices.menuItem.category:id,name',
            'items.prices.menuItem.primaryImage:id,menu_item_id,image_url',
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<int, int>
     */
    private function menuItemIdsForPayload(array $data): array
    {
        return collect($data['package_components'] ?? [])
            ->filter(fn (mixed $component): bool => is_array($component))
            ->flatMap(function (array $component): array {
                $ids = [];

                if (is_numeric($component['menu_item_id'] ?? null)) {
                    $ids[] = (int) $component['menu_item_id'];
                }

                foreach ($component['item_prices'] ?? [] as $itemPrice) {
                    if (is_array($itemPrice) && is_numeric($itemPrice['menu_item_id'] ?? null)) {
                        $ids[] = (int) $itemPrice['menu_item_id'];
                    }
                }

                return $ids;
            })
            ->filter(fn (int $id): bool => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, int>  $menuItemIds
     * @return Collection<int, MenuItem>
     *
     * @throws ValidationException
     */
    private function menuItemsForIds(array $menuItemIds): Collection
    {
        $menuItems = MenuItem::query()
            ->active()
            ->whereKey($menuItemIds)
            ->get(['id', 'name', 'base_price', 'promo_price', 'is_recommended'])
            ->keyBy('id');

        if ($menuItems->count() !== count($menuItemIds)) {
            throw ValidationException::withMessages([
                'package_components' => __('One or more selected menu items are no longer available.'),
            ]);
        }

        return $menuItems;
    }

    /**
     * @param  Collection<int, MenuItem>  $menuItems
     * @param  array<string, mixed>  $data
     */
    private function createPackageItems(Package $package, Collection $menuItems, array $data): void
    {
        foreach ($this->packageComponentPayloads($menuItems, $data) as $payload) {
            $itemPrices = $payload['item_prices'];
            $packageItem = $package->items()->create($payload['item']);

            if ($itemPrices !== []) {
                $packageItem->prices()->createMany($itemPrices);
            }
        }
    }

    /**
     * @param  Collection<int, MenuItem>  $menuItems
     * @param  array<string, mixed>  $data
     * @return array<int, array{item: array<string, mixed>, item_prices: array<int, array<string, mixed>>}>
     */
    private function packageComponentPayloads(Collection $menuItems, array $data): array
    {
        return collect($data['package_components'] ?? [])
            ->filter(fn (mixed $component): bool => is_array($component))
            ->map(fn (array $component, int $position): array => $this->componentPayload($component, $menuItems, $position))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $component
     * @param  Collection<int, MenuItem>  $menuItems
     * @return array{item: array<string, mixed>, item_prices: array<int, array<string, mixed>>}
     */
    private function componentPayload(array $component, Collection $menuItems, int $position): array
    {
        $itemPrices = $component['item_prices'] ?? [];

        if ($this->isSelectableGroupComponent($component, $itemPrices)) {
            return $this->selectableComponentPayload($component, $menuItems, $position);
        }

        $menuItemId = (int) ($component['menu_item_id'] ?? 0);
        $menuItem = $this->menuItemOrFail($menuItems, $menuItemId);

        return [
            'item' => [
                'name' => $component['name'] ?? $menuItem->name,
                'menu_item_id' => $menuItemId,
                'menu_category_id' => null,
                'is_recommended' => self::DefaultPackageRecommendation,
                'package_price' => $this->decimal($component['package_price'] ?? $this->menuItemDefaultPrice($menuItem)),
                'min_select' => null,
                'max_select' => null,
                'sort_order' => $position + 1,
            ],
            'item_prices' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $component
     * @param  Collection<int, MenuItem>  $menuItems
     * @return array{item: array<string, mixed>, item_prices: array<int, array<string, mixed>>}
     */
    private function selectableComponentPayload(array $component, Collection $menuItems, int $position): array
    {
        $itemPrices = collect($component['item_prices'] ?? [])
            ->filter(fn (mixed $itemPrice): bool => is_array($itemPrice))
            ->map(function (array $itemPrice) use ($menuItems): array {
                $menuItemId = (int) ($itemPrice['menu_item_id'] ?? 0);
                $menuItem = $this->menuItemOrFail($menuItems, $menuItemId);

                return [
                    'menu_item_id' => $menuItemId,
                    'package_price' => $this->decimal($itemPrice['package_price'] ?? $this->menuItemDefaultPrice($menuItem)),
                    'is_recommended' => $itemPrice['is_recommended'] ?? self::DefaultPackageRecommendation,
                ];
            })
            ->values();
        $defaultMenuItemId = (int) ($component['menu_item_id'] ?? ($itemPrices->first()['menu_item_id'] ?? 0));

        return [
            'item' => [
                'name' => $component['name'] ?? __('Pilihan Paket'),
                'menu_item_id' => $defaultMenuItemId > 0 ? $defaultMenuItemId : null,
                'menu_category_id' => filled($component['menu_category_id'] ?? null) ? (int) $component['menu_category_id'] : null,
                'is_recommended' => self::DefaultPackageRecommendation,
                'package_price' => null,
                'min_select' => $component['min_select'] ?? 1,
                'max_select' => $component['max_select'] ?? 1,
                'sort_order' => $position + 1,
            ],
            'item_prices' => $itemPrices->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, int>  $menuItemIds
     * @param  Collection<int, MenuItem>  $menuItems
     */
    private function packagePrice(array $data, array $menuItemIds, Collection $menuItems): string
    {
        if (array_key_exists('price', $data) && filled($data['price'])) {
            return $this->decimal($data['price']);
        }

        return $this->decimal(
            collect($this->packageComponentPayloads($menuItems, $data))
                ->sum(fn (array $payload): float => $this->payloadDefaultPrice($payload))
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, int>  $menuItemIds
     * @param  Collection<int, MenuItem>  $menuItems
     */
    private function updatedPackagePrice(array $data, Package $package, array $menuItemIds, Collection $menuItems): string
    {
        if (array_key_exists('price', $data) && filled($data['price'])) {
            return $this->decimal($data['price']);
        }

        if (array_key_exists('package_components', $data)) {
            return $this->packagePrice($data, $menuItemIds, $menuItems);
        }

        return $this->decimal($package->price);
    }

    /**
     * @param  array{item: array<string, mixed>, item_prices: array<int, array<string, mixed>>}  $payload
     */
    private function payloadDefaultPrice(array $payload): float
    {
        $item = $payload['item'];

        if (($payload['item_prices'] ?? []) === []) {
            return (float) ($item['package_price'] ?? 0);
        }

        return (float) ($this->lowestChoicePrice($payload) ?? 0);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function promoteTemporaryImages(array $data, int $packageId): void
    {
        $temporaryImageIds = collect($data['temporary_image_ids'] ?? [])
            ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
            ->values();

        if ($temporaryImageIds->isEmpty()) {
            return;
        }

        $primaryTemporaryImageId = filled($data['primary_temporary_image_id'] ?? null)
            ? (string) $data['primary_temporary_image_id']
            : (string) $temporaryImageIds->first();

        $temporaryImageIds->each(function (string $temporaryImageId) use ($packageId, $primaryTemporaryImageId): void {
            $this->imageAction->promoteTemporaryUpload(
                temporaryImageId: $temporaryImageId,
                packageId: $packageId,
                isPrimary: $temporaryImageId === $primaryTemporaryImageId,
            );
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function deleteRemovedImages(array $data, Package $package): void
    {
        collect($data['removed_image_ids'] ?? [])
            ->filter(fn (mixed $id): bool => is_numeric($id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->each(function (int $imageId) use ($package): void {
                $image = $package->images()
                    ->whereKey($imageId)
                    ->first();

                if ($image instanceof PackageImage) {
                    $this->imageAction->delete($image);
                }
            });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function setExistingPrimaryImage(array $data, Package $package): void
    {
        if (! filled($data['primary_image_id'] ?? null)) {
            return;
        }

        $image = $package->images()
            ->whereKey((int) $data['primary_image_id'])
            ->first();

        if ($image instanceof PackageImage) {
            $this->imageAction->setPrimary($image);
        }
    }

    private function ensurePrimaryImage(Package $package): void
    {
        $hasPrimaryImage = $package->images()
            ->where('is_primary', true)
            ->exists();

        if ($hasPrimaryImage) {
            return;
        }

        $image = $package->images()
            ->orderBy('sort_order')
            ->first();

        if ($image instanceof PackageImage) {
            $this->imageAction->setPrimary($image);
        }
    }

    /**
     * @param  Collection<int, MenuItem>  $menuItems
     *
     * @throws ValidationException
     */
    private function menuItemOrFail(Collection $menuItems, int $menuItemId): MenuItem
    {
        $menuItem = $menuItems->get($menuItemId);

        if (! $menuItem instanceof MenuItem) {
            throw ValidationException::withMessages([
                'package_components' => __('One or more selected menu items are no longer available.'),
            ]);
        }

        return $menuItem;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function serializeMenuItem(?MenuItem $menuItem): ?array
    {
        if ($menuItem === null) {
            return null;
        }

        return [
            'id' => $menuItem->id,
            'menu_category_id' => $menuItem->menu_category_id,
            'name' => $menuItem->name,
            'slug' => $menuItem->slug,
            'base_price' => $menuItem->base_price,
            'promo_price' => $menuItem->promo_price,
            'min_order' => $menuItem->min_order,
            'is_recommended' => $menuItem->is_recommended,
            'is_active' => $menuItem->is_active,
            'primary_image' => $menuItem->primaryImage?->image_url,
            'menu_category' => $menuItem->category ? [
                'id' => $menuItem->category->id,
                'name' => $menuItem->category->name,
            ] : null,
        ];
    }

    /**
     * @return array{id: int, name: string}|null
     */
    private function formatUser(?User $user): ?array
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
     * @return array{id: int, name: string}|null
     */
    private function formatJoinedUser(Package $package, string $idAttribute, string $nameAttribute): ?array
    {
        $id = $package->getAttribute($idAttribute);
        $name = $package->getAttribute($nameAttribute);

        if ($id === null || $name === null) {
            return null;
        }

        return [
            'id' => (int) $id,
            'name' => (string) $name,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function value(array $data, string $key, mixed $fallback): mixed
    {
        return array_key_exists($key, $data) ? $data[$key] : $fallback;
    }

    /**
     * @param  array<string, mixed>  $component
     */
    private function isSelectableGroupComponent(array $component, mixed $itemPrices): bool
    {
        return filled($component['menu_category_id'] ?? null)
            || array_key_exists('min_select', $component)
            || array_key_exists('max_select', $component)
            || array_key_exists('item_prices', $component)
            || (is_array($itemPrices) && $itemPrices !== []);
    }

    /**
     * @param  array{item: array<string, mixed>, item_prices: array<int, array<string, mixed>>}  $payload
     */
    private function lowestChoicePrice(array $payload): ?string
    {
        $itemPrices = collect($payload['item_prices'])
            ->filter(fn (mixed $itemPrice): bool => is_array($itemPrice) && array_key_exists('package_price', $itemPrice))
            ->map(fn (array $itemPrice): string => (string) $itemPrice['package_price']);
        $pricedItemPrices = $itemPrices->filter(fn (string $packagePrice): bool => (float) $packagePrice > 0);
        $lowestPrice = ($pricedItemPrices->isNotEmpty() ? $pricedItemPrices : $itemPrices)
            ->sortBy(fn (string $packagePrice): float => (float) $packagePrice)
            ->first();

        if ($lowestPrice === null) {
            return null;
        }

        return $lowestPrice;
    }

    private function menuItemDefaultPrice(MenuItem $menuItem): mixed
    {
        return $menuItem->base_price;
    }

    private function decimal(mixed $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function nextSortOrder(): int
    {
        return ((int) Package::query()->max('sort_order')) + 1;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function normalizeCategoryId(array $data, ?Package $package = null): ?int
    {
        if (
            ! array_key_exists('package_category_id', $data) &&
            ! array_key_exists('package_category_name', $data)
        ) {
            return $package?->package_category_id;
        }

        if (filled($data['package_category_id'] ?? null)) {
            $categoryId = (int) $data['package_category_id'];

            if (array_key_exists('package_category_icon', $data)) {
                PackageCategory::query()->whereKey($categoryId)->update([
                    'icon' => $data['package_category_icon'],
                ]);
                cache()->forget('package_categories');
            }

            return $categoryId;
        }

        if (filled($data['package_category_name'] ?? null)) {
            return $this->findOrCreateCategoryByName(
                (string) $data['package_category_name'],
                isset($data['package_category_icon']) ? (string) $data['package_category_icon'] : null,
            )->id;
        }

        return null;
    }

    private function findOrCreateCategoryByName(string $name, ?string $icon = null): PackageCategory
    {
        $name = trim($name);

        $category = PackageCategory::query()
            ->where('name', $name)
            ->first();

        if ($category instanceof PackageCategory) {
            return $category;
        }

        return PackageCategory::create([
            'name' => $name,
            'slug' => $this->generateUniqueCategorySlug($name),
            'icon' => $icon,
            'is_active' => true,
            'sort_order' => $this->nextCategorySortOrder(),
        ]);
    }

    private function generateUniqueCategorySlug(string $name): string
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

    private function nextCategorySortOrder(): int
    {
        return ((int) PackageCategory::query()->max('sort_order')) + 1;
    }

    /**
     * @param  array{search: string, category_id: int|null, status: string, recommended: string, promo: string}  $filters
     * @return Builder<Package>
     */
    private function applyIndexFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $search = $filters['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('packages.name', 'like', "%{$search}%")
                        ->orWhere('packages.description', 'like', "%{$search}%")
                        ->orWhere('package_categories.name', 'like', "%{$search}%")
                        ->orWhereExists(function ($query) use ($search): void {
                            $query
                                ->selectRaw('1')
                                ->from('package_items')
                                ->whereColumn('package_items.package_id', 'packages.id')
                                ->where('package_items.name', 'like', "%{$search}%");
                        })
                        ->orWhereExists(function ($query) use ($search): void {
                            $query
                                ->selectRaw('1')
                                ->from('package_items')
                                ->join('menu_items', 'menu_items.id', '=', 'package_items.menu_item_id')
                                ->whereColumn('package_items.package_id', 'packages.id')
                                ->where('menu_items.name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($filters['category_id'] !== null, function (Builder $query) use ($filters): void {
                $query->where('packages.package_category_id', $filters['category_id']);
            })
            ->when($filters['status'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('packages.is_active', $filters['status'] === 'active');
            })
            ->when($filters['recommended'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('packages.is_recommended', $filters['recommended'] === 'yes');
            })
            ->when($filters['promo'] !== 'all', function (Builder $query) use ($filters): void {
                $query->whereRaw(
                    ($filters['promo'] === 'yes' ? '' : 'NOT ').'('.$this->packageCustomPriceExistsSql().')',
                );
            });
    }

    /**
     * @param  array{sort_by: string, sort_dir: string}  $filters
     */
    private function applyIndexSort(Builder $query, array $filters): Builder
    {
        $direction = $filters['sort_dir'];

        match ($filters['sort_by']) {
            'category' => $query
                ->orderBy('package_categories.name', $direction)
                ->orderBy('packages.name'),
            'name' => $query->orderBy('packages.name', $direction),
            'price' => $query
                ->orderBy('packages.price', $direction)
                ->orderBy('packages.name'),
            'min_order' => $query
                ->orderBy('packages.min_order', $direction)
                ->orderBy('packages.name'),
            'status' => $query
                ->orderBy('packages.is_active', $direction)
                ->orderBy('packages.name'),
            'recommended' => $query
                ->orderBy('packages.is_recommended', $direction)
                ->orderBy('packages.name'),
            'promo' => $query
                ->orderByRaw("CASE WHEN {$this->packageCustomPriceExistsSql()} THEN 1 ELSE 0 END {$direction}")
                ->orderBy('packages.name'),
            'created_at' => $query
                ->orderBy('packages.created_at', $direction)
                ->orderBy('packages.name'),
            'updated_at' => $query
                ->orderByRaw("COALESCE(packages.updated_at, packages.created_at) {$direction}")
                ->orderBy('packages.name'),
            default => $query
                ->orderBy('packages.sort_order', $direction)
                ->orderBy('packages.name'),
        };

        return $query;
    }

    private function packageCustomPriceExistsSql(): string
    {
        return <<<'SQL'
EXISTS (
    SELECT 1
    FROM package_items AS fixed_package_items
    INNER JOIN menu_items AS fixed_menu_items
        ON fixed_menu_items.id = fixed_package_items.menu_item_id
    WHERE fixed_package_items.package_id = packages.id
        AND fixed_package_items.package_price IS NOT NULL
        AND fixed_package_items.package_price <> fixed_menu_items.base_price
)
OR EXISTS (
    SELECT 1
    FROM package_items AS choice_package_items
    INNER JOIN package_item_prices AS choice_prices
        ON choice_prices.package_item_id = choice_package_items.id
    INNER JOIN menu_items AS choice_menu_items
        ON choice_menu_items.id = choice_prices.menu_item_id
    WHERE choice_package_items.package_id = packages.id
        AND choice_prices.package_price IS NOT NULL
        AND choice_prices.package_price <> choice_menu_items.base_price
)
SQL;
    }

    private function generateUniqueSlug(string $name): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 2;

        while (Package::query()->where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
