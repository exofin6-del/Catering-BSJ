<?php

namespace App\Actions\Admin\Order;

use App\Models\BusinessSetting;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use App\Models\PackageItem;
use App\Models\PackageItemPrice;
use App\Models\Payment;
use App\Services\CloudinaryService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderAction
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    private const DefaultDpPercentage = 50.0;

    private const DefaultPerPage = 10;

    private const PerPageOptions = [10, 25, 50, 100];

    private const SortByOptions = [
        'created_at',
        'updated_at',
        'event_date',
        'customer_name',
        'total_price',
        'status',
        'payment_status',
    ];

    private const CommandCatalogLimit = 50;

    private const MaxCommandCatalogLimit = 200;

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
            ->through(fn (Order $order): array => $this->serialize($order));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return \Illuminate\Database\Eloquent\Collection<int, Order>
     */
    public function export(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $normalizedFilters = $this->normalizeIndexFilters($filters);

        return $this->applyIndexFilters($this->indexQuery(), $normalizedFilters)
            ->tap(fn (Builder $query): Builder => $this->applyIndexSort($query, $normalizedFilters))
            ->get();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function exportRows(array $filters = []): array
    {
        return $this->export($filters)
            ->map(fn (Order $order): array => $this->serialize($order))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{search: string, per_page: int, per_page_options: array<int, int>, status: string, payment_status: string, payment_type: string, event_date_from: string|null, event_date_to: string|null, sort_by: string, sort_dir: string}
     */
    public function normalizeIndexFilters(array $filters = []): array
    {
        $perPage = (int) ($filters['per_page'] ?? self::DefaultPerPage);
        $sortBy = (string) ($filters['sort_by'] ?? 'created_at');
        $sortDir = strtolower((string) ($filters['sort_dir'] ?? 'desc'));
        $status = (string) ($filters['status'] ?? 'all');
        $paymentStatus = (string) ($filters['payment_status'] ?? 'all');
        $paymentType = (string) ($filters['payment_type'] ?? 'all');
        if (! in_array($perPage, self::PerPageOptions, true)) {
            $perPage = self::DefaultPerPage;
        }

        if (! in_array($sortBy, self::SortByOptions, true)) {
            $sortBy = 'created_at';
        }

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        if (! in_array($status, ['all', 'pending_confirmation', 'confirmed', 'completed', 'canceled'], true)) {
            $status = 'all';
        }

        if (! in_array($paymentStatus, ['all', 'unpaid', 'dp_paid', 'paid'], true)) {
            $paymentStatus = 'all';
        }

        if (! in_array($paymentType, ['all', 'dp', 'full'], true)) {
            $paymentType = 'all';
        }

        return [
            'search' => trim((string) ($filters['search'] ?? '')),
            'per_page' => $perPage,
            'per_page_options' => self::PerPageOptions,
            'status' => $status,
            'payment_status' => $paymentStatus,
            'payment_type' => $paymentType,
            'event_date_from' => filled($filters['event_date_from'] ?? null) ? (string) $filters['event_date_from'] : null,
            'event_date_to' => filled($filters['event_date_to'] ?? null) ? (string) $filters['event_date_to'] : null,
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
            ->orderByRaw('COALESCE(orders.updated_at, orders.created_at) DESC')
            ->orderByDesc('orders.id')
            ->limit($limit)
            ->get()
            ->map(fn (Order $order): array => $this->serialize($order))
            ->values()
            ->all();
    }

    /**
     * @return array{total: int, pending_confirmation: int, confirmed: int, completed: int, canceled: int, unpaid: int, dp_paid: int, paid: int}
     */
    public function stats(): array
    {
        $stats = Order::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'pending_confirmation' THEN 1 ELSE 0 END) as pending_confirmation")
            ->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled")
            ->selectRaw("SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid")
            ->selectRaw("SUM(CASE WHEN payment_status = 'dp_paid' THEN 1 ELSE 0 END) as dp_paid")
            ->selectRaw("SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid")
            ->first();

        return [
            'total' => (int) ($stats?->total ?? 0),
            'pending_confirmation' => (int) ($stats?->pending_confirmation ?? 0),
            'confirmed' => (int) ($stats?->confirmed ?? 0),
            'completed' => (int) ($stats?->completed ?? 0),
            'canceled' => (int) ($stats?->canceled ?? 0),
            'unpaid' => (int) ($stats?->unpaid ?? 0),
            'dp_paid' => (int) ($stats?->dp_paid ?? 0),
            'paid' => (int) ($stats?->paid ?? 0),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function menuItemsForCommand(): array
    {
        return $this->menuItemsForCommandQuery()
            ->get(['id', 'menu_category_id', 'name', 'slug', 'base_price', 'promo_price', 'description', 'min_order', 'is_recommended', 'is_active'])
            ->pipe(fn (Collection $items): array => $this->serializeMenuItemsForCommand($items));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function packagesForCommand(): array
    {
        return $this->packagesForCommandQuery()
            ->get(['id', 'package_category_id', 'name', 'slug', 'price', 'min_order', 'description', 'is_recommended', 'is_active'])
            ->pipe(fn (Collection $packages): array => $this->serializePackagesForCommand($packages));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{menuItems: array<int, array<string, mixed>>, menuItemsTotal: int, packages: array<int, array<string, mixed>>, packagesTotal: int}
     */
    public function commandCatalog(array $filters = []): array
    {
        $category = trim((string) ($filters['category'] ?? ''));
        $search = trim((string) ($filters['search'] ?? ''));
        $type = (string) ($filters['type'] ?? 'all');
        $menuLimit = $this->commandCatalogLimit($filters['menu_limit'] ?? null);
        $packageLimit = $this->commandCatalogLimit($filters['package_limit'] ?? null);
        $includeMenu = $type !== 'package';
        $includePackage = $type !== 'menu';
        $menuQuery = $includeMenu ? $this->menuItemsForCommandQuery($search, category: $category) : null;
        $packageQuery = $includePackage ? $this->packagesForCommandQuery($search, category: $category) : null;

        return [
            'menuItems' => $menuQuery instanceof Builder
                ? (clone $menuQuery)
                    ->limit($menuLimit)
                    ->get(['id', 'menu_category_id', 'name', 'slug', 'base_price', 'promo_price', 'description', 'min_order', 'is_recommended', 'is_active'])
                    ->pipe(fn (Collection $items): array => $this->serializeMenuItemsForCommand($items))
                : [],
            'menuItemsTotal' => $menuQuery instanceof Builder ? (clone $menuQuery)->count() : 0,
            'packages' => $packageQuery instanceof Builder
                ? (clone $packageQuery)
                    ->limit($packageLimit)
                    ->get(['id', 'package_category_id', 'name', 'slug', 'price', 'min_order', 'description', 'is_recommended', 'is_active'])
                    ->pipe(fn (Collection $packages): array => $this->serializePackagesForCommand($packages))
                : [],
            'packagesTotal' => $packageQuery instanceof Builder ? (clone $packageQuery)->count() : 0,
        ];
    }

    /**
     * @return array{menuItems: array<int, array<string, mixed>>, packages: array<int, array<string, mixed>>}
     */
    public function initialCommandCatalog(?Order $order = null): array
    {
        if (! $order instanceof Order) {
            return [
                'menuItems' => $this->menuItemsForCommand(),
                'packages' => $this->packagesForCommand(),
            ];
        }

        $order->loadMissing('items');
        $menuItemIds = $order->items
            ->where('item_type', 'menu_item')
            ->pluck('menu_item_id')
            ->filter()
            ->unique()
            ->values();
        $packageIds = $order->items
            ->where('item_type', 'package')
            ->pluck('package_id')
            ->filter()
            ->unique()
            ->values();
        $selectedMenuItems = $menuItemIds->isEmpty()
            ? []
            : $this->menuItemsForCommandQuery(activeOnly: false)
                ->whereKey($menuItemIds)
                ->get(['id', 'menu_category_id', 'name', 'slug', 'base_price', 'promo_price', 'description', 'min_order', 'is_recommended', 'is_active'])
                ->pipe(fn (Collection $items): array => $this->serializeMenuItemsForCommand($items));
        $selectedPackages = $packageIds->isEmpty()
            ? []
            : $this->packagesForCommandQuery(activeOnly: false)
                ->whereKey($packageIds)
                ->get(['id', 'package_category_id', 'name', 'slug', 'price', 'min_order', 'description', 'is_recommended', 'is_active'])
                ->pipe(fn (Collection $packages): array => $this->serializePackagesForCommand($packages));

        return [
            'menuItems' => $this->mergeCommandCatalogItems(
                $this->menuItemsForCommand(),
                $selectedMenuItems,
            ),
            'packages' => $this->mergeCommandCatalogItems(
                $this->packagesForCommand(),
                $selectedPackages,
            ),
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $activeItems
     * @param  array<int, array<string, mixed>>  $selectedItems
     * @return array<int, array<string, mixed>>
     */
    private function mergeCommandCatalogItems(array $activeItems, array $selectedItems): array
    {
        return collect($activeItems)
            ->concat($selectedItems)
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function businessSettingForCommand(?BusinessSetting $setting = null): array
    {
        $setting ??= $this->businessSetting();

        return [
            'business_lat' => $setting->business_lat,
            'business_lng' => $setting->business_lng,
            'max_order_km' => $setting->max_order_km,
            'max_orders_per_day' => $setting->max_orders_per_day,
            'operational_start_time' => $this->formatTimeValue($setting->operational_start_time),
            'operational_end_time' => $this->formatTimeValue($setting->operational_end_time),
        ];
    }

    /**
     * @return array{days: array<string, int>, max_orders_per_day: int}
     */
    public function calendarCapacity(string $month): array
    {
        $startDate = CarbonImmutable::createFromFormat('!Y-m', $month)->startOfMonth();
        $endDate = $startDate->endOfMonth();
        $setting = $this->businessSetting();

        $days = Order::query()
            ->selectRaw('DATE(event_date) as event_day')
            ->selectRaw('COUNT(*) as order_count')
            ->whereBetween('event_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->where('status', '!=', 'canceled')
            ->groupByRaw('DATE(event_date)')
            ->pluck('order_count', 'event_day')
            ->map(fn (mixed $count): int => (int) $count)
            ->all();

        return [
            'days' => $days,
            'max_orders_per_day' => max(1, (int) $setting->max_orders_per_day),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function serialize(Order $order): array
    {
        $order->loadMissing([
            'createdByAdmin:id,name',
            'items.menuItem:id,menu_category_id,name,slug,base_price,promo_price,min_order,is_active',
            'items.menuItem.category:id,name',
            'items.menuItem.primaryImage:id,menu_item_id,image_url',
            'items.package:id,package_category_id,name,slug,price,min_order,is_active',
            'items.package.category:id,name',
            'items.package.primaryImage:id,package_id,image_url',
            'payments',
        ]);

        return [
            'id' => $order->id,
            'can_edit' => $order->canBeEdited(),
            'order_code' => $order->order_code,
            'customer_name' => $order->customer_name,
            'phone' => $order->phone,
            'event_date' => $order->event_date?->toDateString(),
            'event_time' => $this->formatTimeValue($order->event_time),
            'event_name' => $order->event_name,
            'event_address' => $order->event_address,
            'address_name' => $order->address_name,
            'latitude' => $order->latitude,
            'longitude' => $order->longitude,
            'order_distance_km' => $order->order_distance_km,
            'subtotal' => $order->subtotal,

            'total_price' => $order->total_price,
            'payment_type' => $order->payment_type,
            'dp_amount' => $order->dp_amount,
            'remaining_amount' => $order->remaining_amount,
            'payment_status' => $order->payment_status,
            'status' => $order->status,
            'created_by_admin' => $order->createdByAdmin ? [
                'id' => $order->createdByAdmin->id,
                'name' => $order->createdByAdmin->name,
            ] : null,
            'notes' => $order->notes,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
            'items' => $order->items
                ->map(fn (OrderItem $item): array => $this->serializeItem($item))
                ->values()
                ->all(),
            'payments' => $order->payments
                ->map(fn (Payment $payment): array => $this->serializePayment($payment))
                ->values()
                ->all(),
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(
        array $data,
        ?int $userId = null,
        bool $enforceLimits = true,
        bool $enforceDailyOrderLimit = true,
    ): Order {
        return DB::transaction(function () use ($data, $userId, $enforceLimits, $enforceDailyOrderLimit): Order {
            $itemPayloads = $this->orderItemPayloads($data['items'] ?? []);
            $setting = $this->businessSetting();
            $totals = $this->totals($data, $itemPayloads, null, $setting, $enforceLimits);

            if ($enforceDailyOrderLimit) {
                $this->validateDailyOrderLimit($data, $setting);
            }

            $order = Order::create([
                ...$this->orderAttributes($data, $totals),
                'order_code' => $this->generateOrderCode(),
                'created_by_admin_id' => $userId,
            ]);

            $order->items()->createMany($itemPayloads);
            $this->syncSubmittedPayment($order, $data);
            $this->syncPaymentStatus($order);
            $order->refresh();
            $this->ensureCompletedOrderHasSettledPayment($order);

            return $order->load($this->orderRelations());
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(
        Order $order,
        array $data,
        bool $enforceLimits = false,
        bool $enforceDailyOrderLimit = true,
    ): Order {
        return DB::transaction(function () use ($order, $data, $enforceLimits, $enforceDailyOrderLimit): Order {
            $replaceItems = array_key_exists('items', $data);
            $itemPayloads = $replaceItems
                ? $this->orderItemPayloads($data['items'] ?? [])
                : $this->existingItemPayloads($order);
            $setting = $this->businessSetting();
            $totals = $this->totals($data, $itemPayloads, $order, $setting, $enforceLimits);

            if ($enforceDailyOrderLimit) {
                $this->validateDailyOrderLimit($data, $setting, $order);
            }

            $order->update($this->orderAttributes($data, $totals, $order));

            if ($replaceItems) {
                $order->items()->delete();
                $order->items()->createMany($itemPayloads);
            }

            $this->syncSubmittedPayment($order, $data);
            $this->syncPaymentStatus($order);
            $order->refresh();
            $this->ensureCompletedOrderHasSettledPayment($order);

            return $order->load($this->orderRelations());
        });
    }

    public function updateStatus(Order $order, string $status): Order
    {
        if ($order->status === $status) {
            return $order->refresh();
        }

        $allowedStatuses = match ($order->status) {
            'pending_confirmation' => ['canceled'],
            'confirmed' => ['completed'],
            default => [],
        };

        if (! in_array($status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => __('Perubahan status order tidak diizinkan.'),
            ]);
        }

        if ($status === 'completed') {
            $this->ensureOrderCanBeCompleted($order);
        }

        if ($status === 'canceled') {
            $this->ensureOrderCanBeCanceled($order);
        }

        $order->update(['status' => $status]);

        return $order->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function accept(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data): Order {
            $lockedOrder = Order::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedOrder->status !== 'pending_confirmation') {
                throw ValidationException::withMessages([
                    'status' => __('Hanya order yang menunggu konfirmasi yang dapat diterima.'),
                ]);
            }

            if ((bool) ($data['record_payment'] ?? false)) {
                $paidAmount = (float) $lockedOrder->payments()->sum('amount');
                $remainingAmount = max(0, (float) $lockedOrder->total_price - $paidAmount);
                $paymentAmount = (float) ($data['payment_amount'] ?? 0);

                if ($paymentAmount <= 0 || $paymentAmount > $remainingAmount) {
                    throw ValidationException::withMessages([
                        'payment_amount' => __('Nominal pembayaran harus lebih dari nol dan tidak melebihi sisa tagihan.'),
                    ]);
                }

                $paymentData = $this->storePaymentProof($lockedOrder, $data);

                $lockedOrder->payments()->create([
                    'type' => $paidAmount > 0 ? 'remaining' : $lockedOrder->payment_type,
                    'amount' => $this->decimal($paymentAmount),
                    'method' => (string) $paymentData['payment_method'],
                    'paid_at' => $paymentData['payment_paid_at'] ?? now(),
                    'proof_image' => $paymentData['proof_image'] ?? null,
                    'cloudinary_public_id' => $paymentData['cloudinary_public_id'] ?? null,
                    'notes' => __('Pembayaran dicatat saat order diterima.'),
                ]);
            }

            $this->syncPaymentStatus($lockedOrder);
            $lockedOrder->update(['status' => 'confirmed']);

            return $lockedOrder->refresh()->load($this->orderRelations());
        });
    }

    public function delete(Order $order): void
    {
        $order->delete();
    }

    /**
     * @return Builder<Order>
     */
    private function indexQuery(): Builder
    {
        return Order::query()
            ->select('orders.*')
            ->with($this->orderRelations());
    }

    /**
     * @return array<int, string>
     */
    private function orderRelations(): array
    {
        return [
            'createdByAdmin:id,name',
            'items.menuItem:id,menu_category_id,name,slug,base_price,promo_price,min_order,is_active',
            'items.menuItem.category:id,name',
            'items.menuItem.primaryImage:id,menu_item_id,image_url',
            'items.package:id,package_category_id,name,slug,price,min_order,is_active',
            'items.package.category:id,name',
            'items.package.primaryImage:id,package_id,image_url',
            'payments',
        ];
    }

    private function commandCatalogLimit(mixed $value): int
    {
        $limit = filled($value) && is_numeric($value)
            ? (int) $value
            : self::CommandCatalogLimit;

        return min(
            self::MaxCommandCatalogLimit,
            max(self::CommandCatalogLimit, $limit),
        );
    }

    /**
     * @return Builder<MenuItem>
     */
    private function menuItemsForCommandQuery(string $search = '', bool $activeOnly = true, string $category = ''): Builder
    {
        return MenuItem::query()
            ->when($activeOnly, fn (Builder $query): Builder => $query->active())
            ->when($category !== '', function (Builder $query) use ($category): void {
                $query->whereHas('category', function (Builder $query) use ($category): void {
                    $query->where('name', $category);
                });
            })
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('category', function (Builder $query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->ordered()
            ->with(['category:id,name,icon', 'primaryImage:id,menu_item_id,image_url']);
    }

    /**
     * @return Builder<Package>
     */
    private function packagesForCommandQuery(string $search = '', bool $activeOnly = true, string $category = ''): Builder
    {
        return Package::query()
            ->when($activeOnly, fn (Builder $query): Builder => $query->active())
            ->when($category !== '', function (Builder $query) use ($category): void {
                $query->whereHas('category', function (Builder $query) use ($category): void {
                    $query->where('name', $category);
                });
            })
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('category', function (Builder $query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->ordered()
            ->with($this->packageRelations());
    }

    /**
     * @return array<string, mixed>
     */
    private function packageRelations(): array
    {
        return [
            'category:id,name,icon',
            'primaryImage:id,package_id,image_url',
            'items' => fn ($query) => $query
                ->select(['id', 'package_id', 'name', 'menu_item_id', 'menu_category_id', 'package_price', 'min_select', 'max_select', 'sort_order'])
                ->orderBy('sort_order')
                ->orderBy('id'),
            'items.menuItem:id,name,base_price,promo_price,is_active',
            'items.menuItem.primaryImage:id,menu_item_id,image_url',
            'items.prices' => fn ($query) => $query
                ->select(['id', 'package_item_id', 'menu_item_id', 'package_price', 'is_recommended'])
                ->orderBy('id'),
            'items.prices.menuItem:id,name,base_price,promo_price,is_active',
            'items.prices.menuItem.primaryImage:id,menu_item_id,image_url',
        ];
    }

    /**
     * @param  array{search: string, status: string, payment_status: string, payment_type: string, event_date_from: string|null, event_date_to: string|null}  $filters
     * @return Builder<Order>
     */
    private function applyIndexFilters(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $search = $filters['search'];

                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('orders.order_code', 'like', "%{$search}%")
                        ->orWhere('orders.customer_name', 'like', "%{$search}%")
                        ->orWhere('orders.phone', 'like', "%{$search}%")
                        ->orWhere('orders.event_name', 'like', "%{$search}%")
                        ->orWhere('orders.event_address', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('orders.status', $filters['status']);
            })
            ->when($filters['payment_status'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('orders.payment_status', $filters['payment_status']);
            })
            ->when($filters['payment_type'] !== 'all', function (Builder $query) use ($filters): void {
                $query->where('orders.payment_type', $filters['payment_type']);
            })
            ->when($filters['event_date_from'] !== null, function (Builder $query) use ($filters): void {
                $query->whereDate('orders.event_date', '>=', $filters['event_date_from']);
            })
            ->when($filters['event_date_to'] !== null, function (Builder $query) use ($filters): void {
                $query->whereDate('orders.event_date', '<=', $filters['event_date_to']);
            });
    }

    /**
     * @param  array{sort_by: string, sort_dir: string}  $filters
     */
    private function applyIndexSort(Builder $query, array $filters): Builder
    {
        $direction = $filters['sort_dir'];

        match ($filters['sort_by']) {
            'event_date' => $query
                ->orderBy('orders.event_date', $direction)
                ->orderBy('orders.event_time', $direction)
                ->orderByDesc('orders.id'),
            'customer_name' => $query
                ->orderBy('orders.customer_name', $direction)
                ->orderByDesc('orders.id'),
            'total_price' => $query
                ->orderBy('orders.total_price', $direction)
                ->orderByDesc('orders.id'),
            'status' => $query
                ->orderBy('orders.status', $direction)
                ->orderByDesc('orders.id'),
            'payment_status' => $query
                ->orderBy('orders.payment_status', $direction)
                ->orderByDesc('orders.id'),
            'updated_at' => $query
                ->orderByRaw("COALESCE(orders.updated_at, orders.created_at) {$direction}")
                ->orderByDesc('orders.id'),
            default => $query
                ->orderBy('orders.created_at', $direction)
                ->orderBy('orders.id', $direction),
        };

        return $query;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function orderItemPayloads(array $items): array
    {
        return collect($items)
            ->filter(fn (mixed $item): bool => is_array($item))
            ->map(fn (array $item, int $index): array => $this->orderItemPayload($item, $index))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function orderItemPayload(array $item, int $index): array
    {
        $qty = (int) ($item['qty'] ?? 1);

        if (($item['item_type'] ?? null) === 'package') {
            return $this->packageOrderItemPayload($item, $qty, $index);
        }

        return $this->menuOrderItemPayload($item, $qty, $index);
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function menuOrderItemPayload(array $item, int $qty, int $index): array
    {
        $menuItem = MenuItem::query()
            ->active()
            ->whereKey((int) ($item['menu_item_id'] ?? 0))
            ->first(['id', 'name', 'base_price', 'promo_price', 'min_order']);

        if (! $menuItem instanceof MenuItem) {
            throw ValidationException::withMessages([
                "items.$index.menu_item_id" => __('The selected menu item is no longer available.'),
            ]);
        }

        $price = $this->menuItemPrice($menuItem);
        $this->validateMinimumOrder($qty, (int) $menuItem->min_order, "items.$index.qty", $menuItem->name);

        return [
            'menu_item_id' => $menuItem->id,
            'package_id' => null,
            'item_type' => 'menu_item',
            'name_snapshot' => $menuItem->name,
            'price_snapshot' => $this->decimal($price),
            'qty' => $qty,
            'subtotal' => $this->decimal($price * $qty),
            'selected_items' => null,
        ];
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function packageOrderItemPayload(array $item, int $qty, int $index): array
    {
        $package = Package::query()
            ->active()
            ->with($this->packageRelations())
            ->whereKey((int) ($item['package_id'] ?? 0))
            ->first(['id', 'package_category_id', 'name', 'slug', 'price', 'min_order', 'is_active']);

        if (! $package instanceof Package) {
            throw ValidationException::withMessages([
                "items.$index.package_id" => __('The selected package is no longer available.'),
            ]);
        }

        $selectedItems = $this->selectedPackageItems($package, $item['selected_items'] ?? [], $index);
        $price = collect($selectedItems)->sum(fn (array $selectedItem): float => (float) $selectedItem['price']);

        if ($price <= 0) {
            $price = (float) $package->price;
        }

        $this->validateMinimumOrder($qty, (int) $package->min_order, "items.$index.qty", $package->name);

        return [
            'menu_item_id' => null,
            'package_id' => $package->id,
            'item_type' => 'package',
            'name_snapshot' => $package->name,
            'price_snapshot' => $this->decimal($price),
            'qty' => $qty,
            'subtotal' => $this->decimal($price * $qty),
            'selected_items' => $selectedItems,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function selectedPackageItems(Package $package, mixed $selectedItems, int $index): array
    {
        $submittedChoices = collect(is_array($selectedItems) ? $selectedItems : [])
            ->filter(fn (mixed $choice): bool => is_array($choice))
            ->values();

        return $package->items
            ->map(function (PackageItem $packageItem) use ($submittedChoices, $index): array {
                if ($packageItem->prices->isEmpty()) {
                    return $this->fixedPackageItemSnapshot($packageItem);
                }

                $submittedChoice = $submittedChoices->first(function (array $choice) use ($packageItem): bool {
                    return (int) ($choice['package_item_id'] ?? 0) === $packageItem->id;
                });

                $price = $submittedChoice
                    ? $this->selectedPackageItemPrice($packageItem, $submittedChoice, $index)
                    : $this->defaultPackageItemPrice($packageItem);

                return $this->packageItemPriceSnapshot($packageItem, $price);
            })
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function fixedPackageItemSnapshot(PackageItem $packageItem): array
    {
        $menuItem = $packageItem->menuItem;
        $price = (float) ($packageItem->package_price ?? ($menuItem ? $this->menuItemPrice($menuItem) : 0));

        return [
            'package_item_id' => $packageItem->id,
            'package_item_name' => $packageItem->name,
            'menu_item_id' => $menuItem?->id,
            'name' => $menuItem?->name ?? $packageItem->name,
            'price' => $this->decimal($price),
        ];
    }

    /**
     * @param  array<string, mixed>  $choice
     */
    private function selectedPackageItemPrice(PackageItem $packageItem, array $choice, int $index): PackageItemPrice
    {
        $menuItemId = (int) ($choice['menu_item_id'] ?? 0);
        $price = $packageItem->prices->first(
            fn (PackageItemPrice $price): bool => (int) $price->menu_item_id === $menuItemId,
        );

        if (! $price instanceof PackageItemPrice) {
            throw ValidationException::withMessages([
                "items.$index.selected_items" => __('One or more selected package choices are not available.'),
            ]);
        }

        return $price;
    }

    private function defaultPackageItemPrice(PackageItem $packageItem): PackageItemPrice
    {
        $defaultMenuItemId = $packageItem->menu_item_id;

        if ($defaultMenuItemId !== null) {
            $defaultPrice = $packageItem->prices->first(
                fn (PackageItemPrice $price): bool => (int) $price->menu_item_id === (int) $defaultMenuItemId,
            );

            if ($defaultPrice instanceof PackageItemPrice) {
                return $defaultPrice;
            }
        }

        return $packageItem->prices->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function packageItemPriceSnapshot(PackageItem $packageItem, PackageItemPrice $price): array
    {
        return [
            'package_item_id' => $packageItem->id,
            'package_item_name' => $packageItem->name,
            'menu_item_id' => $price->menu_item_id,
            'name' => $price->menuItem?->name,
            'price' => $this->decimal((float) $price->package_price),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function existingItemPayloads(Order $order): array
    {
        return $order->items()
            ->get(['menu_item_id', 'package_id', 'item_type', 'name_snapshot', 'price_snapshot', 'qty', 'subtotal', 'selected_items'])
            ->map(fn (OrderItem $item): array => [
                'menu_item_id' => $item->menu_item_id,
                'package_id' => $item->package_id,
                'item_type' => $item->item_type,
                'name_snapshot' => $item->name_snapshot,
                'price_snapshot' => $item->price_snapshot,
                'qty' => $item->qty,
                'subtotal' => $item->subtotal,
                'selected_items' => $item->selected_items,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<int, array<string, mixed>>  $itemPayloads
     * @return array{subtotal: string, discount: string, total_price: string, order_distance_km: string|null, dp_amount: string, remaining_amount: string, payment_type: string}
     */
    private function totals(array $data, array $itemPayloads, ?Order $order = null, ?BusinessSetting $setting = null, bool $enforceLimits = true): array
    {
        $setting ??= $this->businessSetting();
        $subtotal = collect($itemPayloads)->sum(fn (array $item): float => (float) $item['subtotal']);

        $orderDistanceKm = $enforceLimits
            ? $this->orderDistanceKm($setting, $data, $order)
            : null;
        $totalPrice = max(0, $subtotal);
        $submittedPaymentType = (string) ($data['payment_type'] ?? $order?->payment_type ?? 'full');
        $paymentType = $this->paymentTypeForTotals($submittedPaymentType, $order);
        $paidAmount = min($this->paymentAmountForTotals($data, $order), $totalPrice);
        $dpAmount = 0.0;
        $remainingAmount = 0.0;

        if ($paymentType === 'dp') {
            $dpAmount = $this->dpAmountForTotals($data, $totalPrice, $paidAmount, $order);
        }

        if ($paidAmount > 0) {
            $remainingAmount = max(0, $totalPrice - $paidAmount);
        } elseif ($paymentType === 'dp') {
            $remainingAmount = max(0, $totalPrice - $dpAmount);
        }

        return [
            'subtotal' => $this->decimal($subtotal),
            'total_price' => $this->decimal($totalPrice),
            'order_distance_km' => $orderDistanceKm === null ? null : $this->decimal($orderDistanceKm),
            'dp_amount' => $this->decimal($dpAmount),
            'remaining_amount' => $this->decimal($remainingAmount),
            'payment_type' => $paymentType,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function paymentAmountForTotals(array $data, ?Order $order = null): float
    {
        if (! array_key_exists('payment_amount', $data)) {
            return $order instanceof Order
                ? (float) $order->payments()->sum('amount')
                : 0.0;
        }

        if (! $order instanceof Order) {
            return blank($data['payment_amount']) || (float) $data['payment_amount'] <= 0
                ? 0.0
                : (float) $data['payment_amount'];
        }

        if (blank($data['payment_amount']) || (float) $data['payment_amount'] <= 0) {
            return (float) $order->payments()->sum('amount');
        }

        $paymentAmount = (float) $data['payment_amount'];

        $submittedPayment = $this->submittedPaymentForTotals($order);
        $otherPayments = $order->payments()
            ->when(
                $submittedPayment instanceof Payment,
                fn (Builder $query): Builder => $query->whereKeyNot($submittedPayment->id),
            )
            ->sum('amount');
        $submittedPaidAmount = (float) $otherPayments + $paymentAmount;

        if ($order->payment_status === 'paid') {
            return max(
                (float) $order->payments()->sum('amount'),
                $submittedPaidAmount,
            );
        }

        return $submittedPaidAmount;
    }

    private function submittedPaymentForTotals(Order $order): ?Payment
    {
        if ($order->payment_type === 'dp') {
            return $order->payments()
                ->where('type', 'remaining')
                ->whereIn('method', ['transfer', 'cash'])
                ->oldest('id')
                ->first(['id']);
        }

        return $order->payments()
            ->whereIn('method', ['transfer', 'cash'])
            ->oldest('id')
            ->first(['id']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function dpAmountForTotals(array $data, float $totalPrice, float $paidAmount, ?Order $order = null): float
    {
        if ($order instanceof Order && (float) $order->dp_amount > 0) {
            return min((float) $order->dp_amount, $totalPrice);
        }

        if ($order instanceof Order) {
            $dpPaymentAmount = (float) $order->payments()
                ->where('type', 'dp')
                ->oldest('id')
                ->value('amount');

            if ($dpPaymentAmount > 0) {
                return min($dpPaymentAmount, $totalPrice);
            }
        }

        if (array_key_exists('payment_amount', $data) && $paidAmount > 0 && $paidAmount < $totalPrice) {
            return $paidAmount;
        }

        return $totalPrice * (self::DefaultDpPercentage / 100);
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  array<string, string|null>  $totals
     * @return array<string, mixed>
     */
    private function orderAttributes(array $data, array $totals, ?Order $order = null): array
    {
        return [
            'customer_name' => $this->value($data, 'customer_name', $order?->customer_name),
            'phone' => $this->value($data, 'phone', $order?->phone),
            'event_date' => $this->value($data, 'event_date', $order?->event_date),
            'event_time' => $this->value($data, 'event_time', $order?->event_time),
            'event_name' => $this->value($data, 'event_name', $order?->event_name),
            'event_address' => $this->value($data, 'event_address', $order?->event_address),
            'address_name' => $this->value($data, 'address_name', $order?->address_name),
            'latitude' => $this->value($data, 'latitude', $order?->latitude),
            'longitude' => $this->value($data, 'longitude', $order?->longitude),
            'order_distance_km' => $totals['order_distance_km'],
            'subtotal' => $totals['subtotal'],
            'total_price' => $totals['total_price'],
            'payment_type' => $totals['payment_type'],
            'dp_amount' => $totals['dp_amount'],
            'remaining_amount' => $totals['remaining_amount'],
            'payment_status' => $order?->payment_status ?? 'unpaid',
            'status' => $this->statusForAttributes($data, $order),
            'notes' => $this->value($data, 'notes', $order?->notes),
        ];
    }

    private function paymentTypeForTotals(string $submittedPaymentType, ?Order $order = null): string
    {
        if (! $order instanceof Order) {
            return $submittedPaymentType;
        }

        if ($order->payment_type === 'dp' || $order->payment_status === 'paid' || $order->status === 'completed') {
            return $order->payment_type;
        }

        return $submittedPaymentType;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function statusForAttributes(array $data, ?Order $order = null): string
    {
        if ($order instanceof Order && $order->status === 'completed') {
            return 'completed';
        }

        return (string) $this->value($data, 'status', $order?->status ?? 'confirmed');
    }

    private function ensureCompletedOrderHasSettledPayment(Order $order): void
    {
        if ($order->status !== 'completed') {
            return;
        }

        $this->ensureOrderCanBeCompleted($order);
    }

    private function ensureOrderCanBeCompleted(Order $order): void
    {
        if ($this->orderHasSettledPayment($order)) {
            return;
        }

        throw ValidationException::withMessages([
            'status' => __('Order hanya dapat ditandai selesai setelah pembayaran lunas dan tidak ada sisa tagihan.'),
        ]);
    }

    private function orderHasSettledPayment(Order $order): bool
    {
        return $order->payment_status === 'paid'
            && (float) $order->remaining_amount <= 0.0;
    }

    private function ensureOrderCanBeCanceled(Order $order): void
    {
        if ($this->orderCanBeCanceled($order)) {
            return;
        }

        throw ValidationException::withMessages([
            'status' => __('Order hanya dapat dibatalkan sebelum ACC dan sebelum ada pembayaran.'),
        ]);
    }

    private function orderCanBeCanceled(Order $order): bool
    {
        return $order->status === 'pending_confirmation'
            && $order->payment_status === 'unpaid'
            && (float) $order->payments()->sum('amount') <= 0.0;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function validateDailyOrderLimit(array $data, BusinessSetting $setting, ?Order $order = null): void
    {
        $limit = (int) $setting->max_orders_per_day;

        if ($limit < 1) {
            return;
        }

        $status = (string) $this->value($data, 'status', $order?->status ?? 'confirmed');

        if ($status === 'canceled') {
            return;
        }

        $eventDate = $this->value($data, 'event_date', $order?->event_date);

        if ($eventDate instanceof \DateTimeInterface) {
            $eventDate = $eventDate->format('Y-m-d');
        }

        if (blank($eventDate)) {
            return;
        }

        if (! $this->shouldCheckDailyOrderLimit((string) $eventDate, $order)) {
            return;
        }

        $ordersCount = Order::query()
            ->whereDate('event_date', (string) $eventDate)
            ->where('status', '!=', 'canceled')
            ->when(
                $order instanceof Order,
                fn (Builder $query): Builder => $query->where('id', '!=', $order->getKey()),
            )
            ->lockForUpdate()
            ->count();

        if ($ordersCount >= $limit) {
            throw ValidationException::withMessages([
                'event_date' => __('Tanggal acara sudah mencapai batas maksimal :max order per hari.', [
                    'max' => $limit,
                ]),
            ]);
        }
    }

    private function shouldCheckDailyOrderLimit(string $eventDate, ?Order $order = null): bool
    {
        if (! $order instanceof Order) {
            return true;
        }

        $currentEventDate = $order->event_date instanceof \DateTimeInterface
            ? $order->event_date->format('Y-m-d')
            : (string) $order->event_date;

        return $order->status === 'canceled' || $currentEventDate !== $eventDate;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function orderDistanceKm(BusinessSetting $setting, array $data, ?Order $order = null): ?float
    {
        if ($setting->business_lat === null || $setting->business_lng === null) {
            return null;
        }

        $latitudeValue = $this->value($data, 'latitude', $order?->latitude);
        $longitudeValue = $this->value($data, 'longitude', $order?->longitude);

        if (blank($latitudeValue) || blank($longitudeValue)) {
            return null;
        }

        $latitude = (float) $latitudeValue;
        $longitude = (float) $longitudeValue;
        $distance = $this->haversineDistanceKm((float) $setting->business_lat, (float) $setting->business_lng, $latitude, $longitude);

        if ($distance > (float) $setting->max_order_km) {
            throw ValidationException::withMessages([
                'event_address' => __('The event address is outside the maximum order distance.'),
            ]);
        }

        return $distance;
    }

    private function haversineDistanceKm(float $originLatitude, float $originLongitude, float $destinationLatitude, float $destinationLongitude): float
    {
        $earthRadiusKm = 6371;
        $latitudeDelta = deg2rad($destinationLatitude - $originLatitude);
        $longitudeDelta = deg2rad($destinationLongitude - $originLongitude);
        $originLatitude = deg2rad($originLatitude);
        $destinationLatitude = deg2rad($destinationLatitude);
        $a = sin($latitudeDelta / 2) ** 2
            + cos($originLatitude) * cos($destinationLatitude) * sin($longitudeDelta / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    private function businessSetting(): BusinessSetting
    {
        $setting = BusinessSetting::query()->first();

        return $setting instanceof BusinessSetting ? $setting : new BusinessSetting;
    }

    private function generateOrderCode(): string
    {
        $date = now()->format('Ymd');
        $nextNumber = Order::query()
            ->where('order_code', 'like', "ORD-{$date}-%")
            ->lockForUpdate()
            ->count() + 1;

        do {
            $code = sprintf('ORD-%s-%03d', $date, $nextNumber);
            $nextNumber++;
        } while (Order::query()->where('order_code', $code)->exists());

        return $code;
    }

    private function syncPaymentStatus(Order $order): void
    {
        $paidAmount = (float) $order->payments()->sum('amount');
        $totalPrice = (float) $order->total_price;

        $paymentStatus = match (true) {
            $paidAmount <= 0 => 'unpaid',
            $paidAmount >= $totalPrice => 'paid',
            default => 'dp_paid',
        };

        $attributes = ['payment_status' => $paymentStatus];
        $attributes['remaining_amount'] = $this->decimal(
            max(0, $totalPrice - $paidAmount),
        );

        if (
            in_array($paymentStatus, ['dp_paid', 'paid'], true)
            && ! in_array($order->status, ['completed', 'canceled'], true)
        ) {
            $attributes['status'] = 'confirmed';
        }

        $order->update($attributes);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncSubmittedPayment(Order $order, array $data): void
    {
        if (
            ! array_key_exists('payment_amount', $data)
            || blank($data['payment_amount'])
            || (float) $data['payment_amount'] <= 0
        ) {
            return;
        }

        $paidAmount = min(
            $this->paymentAmountForTotals($data, $order),
            (float) $order->total_price,
        );

        if ($paidAmount <= 0) {
            return;
        }

        $data = $this->storePaymentProof($order, $data);

        if ($order->payment_type === 'dp') {
            $this->syncSubmittedDpPayments($order, $data, $paidAmount);

            return;
        }

        $submittedPaymentAmount = min(
            (float) $data['payment_amount'],
            (float) $order->total_price,
        );

        $this->syncSubmittedPaymentByType(
            $order,
            'full',
            $submittedPaymentAmount,
            $data,
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncSubmittedDpPayments(Order $order, array $data, float $paidAmount): void
    {
        $dpAmount = min((float) $order->dp_amount, $paidAmount);
        $remainingAmount = max(0, $paidAmount - $dpAmount);

        if ($dpAmount > 0) {
            $this->syncSubmittedDpPayment($order, $dpAmount, $data);
        }

        if ($remainingAmount > 0) {
            $this->syncSubmittedPaymentByType($order, 'remaining', $remainingAmount, $data);

            return;
        }

        $order->payments()
            ->where('type', 'remaining')
            ->whereIn('method', ['transfer', 'cash'])
            ->delete();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncSubmittedDpPayment(Order $order, float $amount, array $data): void
    {
        $payment = $order->payments()
            ->where('type', 'dp')
            ->oldest('id')
            ->first();

        if ($payment instanceof Payment) {
            $hasNewProof = is_string($data['proof_image'] ?? null);

            if (
                abs((float) $payment->amount - $amount) < 0.01
                && ! $hasNewProof
            ) {
                return;
            }

            $payment->update([
                'amount' => $this->decimal($amount),
                ...($hasNewProof
                    ? [
                        'proof_image' => $data['proof_image'],
                        'cloudinary_public_id' => $data['cloudinary_public_id'] ?? null,
                    ]
                    : []),
            ]);

            return;
        }

        $this->syncSubmittedPaymentByType($order, 'dp', $amount, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function syncSubmittedPaymentByType(Order $order, string $type, float $amount, array $data): void
    {
        $payment = $order->payments()
            ->where('type', $type)
            ->whereIn('method', ['transfer', 'cash'])
            ->oldest('id')
            ->first();

        if (! $payment instanceof Payment && $type === 'full') {
            $payment = $order->payments()
                ->whereIn('method', ['transfer', 'cash'])
                ->oldest('id')
                ->first();
        }

        $paymentPayload = [
            'type' => $type,
            'amount' => $this->decimal($amount),
            'method' => (string) ($data['payment_method'] ?? 'transfer'),
            'paid_at' => $data['payment_paid_at'] ?? now(),
            ...(is_string($data['proof_image'] ?? null)
                ? [
                    'proof_image' => $data['proof_image'],
                    'cloudinary_public_id' => $data['cloudinary_public_id'] ?? null,
                ]
                : []),
        ];

        if ($payment instanceof Payment) {
            $payment->update($paymentPayload);

            return;
        }

        $order->payments()->create($paymentPayload);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function storePaymentProof(Order $order, array $data): array
    {
        $proofImage = $data['proof_image'] ?? null;

        if (! $proofImage instanceof UploadedFile) {
            return $data;
        }

        try {
            $asset = $this->cloudinary->upload($proofImage, "catering/payments/{$order->id}");
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'proof_image' => __('Bukti pembayaran gagal disimpan.'),
            ]);
        }

        return [
            ...$data,
            'proof_image' => $asset['secure_url'],
            'cloudinary_public_id' => $asset['public_id'],
        ];
    }

    private function menuItemPrice(MenuItem $item): float
    {
        return (float) ($item->promo_price ?? $item->base_price);
    }

    private function decimal(float|int|string|null $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }

    private function validateMinimumOrder(int $qty, int $minOrder, string $field, string $name): void
    {
        if ($qty >= $minOrder) {
            return;
        }

        throw ValidationException::withMessages([
            $field => __('Minimum order for :name is :min.', [
                'name' => $name,
                'min' => $minOrder,
            ]),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function value(array $data, string $key, mixed $fallback): mixed
    {
        return array_key_exists($key, $data) ? $data[$key] : $fallback;
    }

    private function formatTimeValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return substr((string) $value, 0, 5);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeItem(OrderItem $item): array
    {
        return [
            'id' => $item->id,
            'order_id' => $item->order_id,
            'menu_item_id' => $item->menu_item_id,
            'package_id' => $item->package_id,
            'item_type' => $item->item_type,
            'name_snapshot' => $item->name_snapshot,
            'price_snapshot' => $item->price_snapshot,
            'qty' => $item->qty,
            'subtotal' => $item->subtotal,
            'selected_items' => $item->selected_items,
            'menu_item' => $item->menuItem ? [
                'id' => $item->menuItem->id,
                'name' => $item->menuItem->name,
                'base_price' => $item->menuItem->base_price,
                'promo_price' => $item->menuItem->promo_price,
                'min_order' => $item->menuItem->min_order,
                'primary_image' => $item->menuItem->primaryImage?->image_url,
                'menu_category' => $item->menuItem->category ? [
                    'id' => $item->menuItem->category->id,
                    'name' => $item->menuItem->category->name,
                ] : null,
            ] : null,
            'package' => $item->package ? [
                'id' => $item->package->id,
                'name' => $item->package->name,
                'price' => $item->package->price,
                'min_order' => $item->package->min_order,
                'primary_image' => $item->package->primaryImage?->image_url,
                'package_category' => $item->package->category ? [
                    'id' => $item->package->category->id,
                    'name' => $item->package->category->name,
                ] : null,
            ] : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePayment(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'order_id' => $payment->order_id,
            'type' => $payment->type,
            'amount' => $payment->amount,
            'method' => $payment->method,
            'paid_at' => $payment->paid_at?->toISOString(),
            'proof_image' => $payment->proof_image,
            'notes' => $payment->notes,
            'created_at' => $payment->created_at?->toISOString(),
        ];
    }

    /**
     * @param  Collection<int, MenuItem>  $items
     * @return array<int, array<string, mixed>>
     */
    private function serializeMenuItemsForCommand(Collection $items): array
    {
        return $items
            ->map(fn (MenuItem $item): array => [
                'id' => $item->id,
                'menu_category_id' => $item->menu_category_id,
                'name' => $item->name,
                'slug' => $item->slug,
                'base_price' => $item->base_price,
                'promo_price' => $item->promo_price,
                'description' => $item->description,
                'min_order' => $item->min_order,
                'is_recommended' => $item->is_recommended,
                'price' => $this->decimal($this->menuItemPrice($item)),
                'primary_image' => $item->primaryImage?->image_url,
                'menu_category' => $item->category ? [
                    'id' => $item->category->id,
                    'icon' => $item->category->icon,
                    'name' => $item->category->name,
                ] : null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, Package>  $packages
     * @return array<int, array<string, mixed>>
     */
    private function serializePackagesForCommand(Collection $packages): array
    {
        return $packages
            ->map(fn (Package $package): array => $this->serializePackageForCommand($package))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializePackageForCommand(Package $package): array
    {
        return [
            'id' => $package->id,
            'package_category_id' => $package->package_category_id,
            'name' => $package->name,
            'slug' => $package->slug,
            'price' => $package->price,
            'min_order' => $package->min_order,
            'description' => $package->description,
            'is_recommended' => $package->is_recommended,
            'primary_image' => $package->primaryImage?->image_url,
            'package_category' => $package->category ? [
                'id' => $package->category->id,
                'icon' => $package->category->icon,
                'name' => $package->category->name,
            ] : null,
            'items' => $package->items
                ->map(fn (PackageItem $packageItem): array => [
                    'id' => $packageItem->id,
                    'name' => $packageItem->name,
                    'menu_item_id' => $packageItem->menu_item_id,
                    'menu_category_id' => $packageItem->menu_category_id,
                    'package_price' => $packageItem->package_price,
                    'min_select' => $packageItem->min_select,
                    'max_select' => $packageItem->max_select,
                    'menu_item' => $packageItem->menuItem ? [
                        'id' => $packageItem->menuItem->id,
                        'name' => $packageItem->menuItem->name,
                        'base_price' => $packageItem->menuItem->base_price,
                        'promo_price' => $packageItem->menuItem->promo_price,
                        'primary_image' => $packageItem->menuItem->primaryImage?->image_url,
                    ] : null,
                    'item_prices' => $packageItem->prices
                        ->map(fn (PackageItemPrice $price): array => [
                            'id' => $price->id,
                            'menu_item_id' => $price->menu_item_id,
                            'package_price' => $price->package_price,
                            'is_recommended' => $price->is_recommended,
                            'menu_item' => $price->menuItem ? [
                                'id' => $price->menuItem->id,
                                'name' => $price->menuItem->name,
                                'base_price' => $price->menuItem->base_price,
                                'promo_price' => $price->menuItem->promo_price,
                                'primary_image' => $price->menuItem->primaryImage?->image_url,
                            ] : null,
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }
}
