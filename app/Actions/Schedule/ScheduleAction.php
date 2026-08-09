<?php

namespace App\Actions\Schedule;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class ScheduleAction
{
    private const DefaultPerPage = 200;

    private const PerPageOptions = [50, 100, 200];

    private const ReadyPaymentStatuses = ['dp_paid', 'paid'];

    private const ScheduledOrderStatuses = ['confirmed'];

    private const SortByOptions = [
        'event_date',
        'customer_name',
        'status',
        'total_price',
        'created_at',
    ];

    /**
     * @param  array<string, mixed>  $filters
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function index(array $filters = []): LengthAwarePaginator
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $today = CarbonImmutable::today();

        return $this->filteredQuery($normalizedFilters, includeSelectedDate: true)
            ->tap(fn (Builder $query): Builder => $this->applySort($query, $normalizedFilters))
            ->paginate($normalizedFilters['per_page'])
            ->withQueryString()
            ->through(fn (Order $order): array => $this->serialize($order, $today));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function export(array $filters = []): array
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $today = CarbonImmutable::today();

        return $this->filteredQuery($normalizedFilters, includeSelectedDate: true)
            ->tap(fn (Builder $query): Builder => $this->applySort($query, $normalizedFilters))
            ->get()
            ->map(fn (Order $order): array => $this->serialize($order, $today))
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{event_date_from: string|null, event_date_to: string|null, export_period: string, month: string, selected_date: string|null, payment_status: string, per_page: int, per_page_options: array<int, int>, scope: string, search: string, sort_by: string, sort_dir: string, status: string}
     */
    public function normalizeFilters(array $filters = []): array
    {
        $perPage = (int) ($filters['per_page'] ?? self::DefaultPerPage);
        $scope = (string) ($filters['scope'] ?? 'day');
        $sortBy = (string) ($filters['sort_by'] ?? 'event_date');
        $sortDir = strtolower((string) ($filters['sort_dir'] ?? 'asc'));
        $paymentStatus = (string) ($filters['payment_status'] ?? 'all');
        $status = (string) ($filters['status'] ?? 'confirmed');
        $exportPeriod = (string) ($filters['export_period'] ?? 'month');
        $month = $this->normalizeMonth($filters['month'] ?? null);
        $selectedDate = $this->normalizeSelectedDate($filters['selected_date'] ?? null, $month);

        if (! in_array($perPage, self::PerPageOptions, true)) {
            $perPage = self::DefaultPerPage;
        }

        if (! in_array($scope, ['all', 'day'], true)) {
            $scope = 'day';
        }

        if (! in_array($sortBy, self::SortByOptions, true)) {
            $sortBy = 'event_date';
        }

        if (! in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'asc';
        }

        if (! in_array($paymentStatus, ['all', 'ready', 'unpaid', 'dp_paid', 'paid'], true)) {
            $paymentStatus = 'all';
        }

        if (! in_array($status, ['all', 'confirmed'], true)) {
            $status = 'all';
        }

        if (! in_array($exportPeriod, ['all', 'month'], true)) {
            $exportPeriod = 'month';
        }

        return [
            'event_date_from' => $this->normalizeDateFilter($filters['event_date_from'] ?? null),
            'event_date_to' => $this->normalizeDateFilter($filters['event_date_to'] ?? null),
            'export_period' => $exportPeriod,
            'month' => $month,
            'selected_date' => $scope === 'day' ? $selectedDate : null,
            'payment_status' => $paymentStatus,
            'per_page' => $perPage,
            'per_page_options' => self::PerPageOptions,
            'scope' => $scope,
            'search' => trim((string) ($filters['search'] ?? '')),
            'sort_by' => $sortBy,
            'sort_dir' => $sortDir,
            'status' => $status,
        ];
    }

    /**
     * @return array{total: int, today: int, upcoming: int, overdue: int}
     */
    public function stats(): array
    {
        $today = CarbonImmutable::today()->toDateString();
        $stats = Order::query()
            ->whereIn('status', self::ScheduledOrderStatuses)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN DATE(event_date) = ? THEN 1 ELSE 0 END) as today', [$today])
            ->selectRaw('SUM(CASE WHEN DATE(event_date) >= ? THEN 1 ELSE 0 END) as upcoming', [$today])
            ->selectRaw('SUM(CASE WHEN DATE(event_date) < ? THEN 1 ELSE 0 END) as overdue', [$today])
            ->first();

        return [
            'total' => (int) ($stats?->total ?? 0),
            'today' => (int) ($stats?->today ?? 0),
            'upcoming' => (int) ($stats?->upcoming ?? 0),
            'overdue' => (int) ($stats?->overdue ?? 0),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array{date: string, day_name: string, day_number: string, id: string, is_selected: bool, is_today: bool, label: string, month_label: string, schedules_count: int}>
     */
    public function calendarDays(array $filters = []): array
    {
        $normalizedFilters = $this->normalizeFilters($filters);
        $month = CarbonImmutable::createFromFormat('Y-m', $normalizedFilters['month'])->startOfMonth();
        $today = CarbonImmutable::today();
        $counts = $this->filteredQuery($normalizedFilters, includeSelectedDate: false, withRelations: false)
            ->selectRaw('DATE(orders.event_date) as schedule_date, COUNT(*) as schedules_count')
            ->groupBy('schedule_date')
            ->pluck('schedules_count', 'schedule_date');

        return collect(CarbonPeriod::create($month, $month->endOfMonth()))
            ->map(function (\DateTimeInterface $date) use ($counts, $normalizedFilters, $today): array {
                $day = CarbonImmutable::instance($date);
                $dateString = $day->toDateString();

                return [
                    'date' => $dateString,
                    'day_name' => $day->locale('id')->isoFormat('ddd'),
                    'day_number' => $day->format('j'),
                    'id' => $dateString,
                    'is_selected' => $normalizedFilters['selected_date'] === $dateString,
                    'is_today' => $day->isSameDay($today),
                    'label' => $this->formatDateLabel($day),
                    'month_label' => $day->locale('id')->isoFormat('MMM'),
                    'schedules_count' => (int) ($counts[$dateString] ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function upcomingActivityItems(int $limit = 5): array
    {
        $today = CarbonImmutable::today();

        return $this->query()
            ->whereIn('orders.status', self::ScheduledOrderStatuses)
            ->whereDate('orders.event_date', '>=', $today->toDateString())
            ->orderBy('orders.event_date')
            ->orderBy('orders.event_time')
            ->orderBy('orders.id')
            ->limit($limit)
            ->get()
            ->map(fn (Order $order): array => $this->serialize($order, $today))
            ->values()
            ->all();
    }

    /**
     * @return Builder<Order>
     */
    private function query(): Builder
    {
        return Order::query()
            ->select('orders.*')
            ->with($this->orderRelations());
    }

    /**
     * @param  array{event_date_from: string|null, event_date_to: string|null, export_period: string, month: string, selected_date: string|null, payment_status: string, per_page: int, per_page_options: array<int, int>, scope: string, search: string, sort_by: string, sort_dir: string, status: string}  $filters
     * @return Builder<Order>
     */
    private function filteredQuery(array $filters, bool $includeSelectedDate, bool $withRelations = true): Builder
    {
        $month = CarbonImmutable::createFromFormat('Y-m', $filters['month'])->startOfMonth();
        $hasDateRange = $filters['event_date_from'] !== null || $filters['event_date_to'] !== null;
        $shouldApplyMonthConstraint = ! $hasDateRange && $filters['export_period'] !== 'all';

        $query = $withRelations
            ? $this->query()
            : Order::query();

        return $query
            ->whereIn('orders.status', self::ScheduledOrderStatuses)
            ->when($shouldApplyMonthConstraint, function (Builder $query) use ($month): void {
                $query->whereBetween('orders.event_date', [
                    $month->toDateString(),
                    $month->endOfMonth()->toDateString(),
                ]);
            })
            ->when($shouldApplyMonthConstraint && $includeSelectedDate && $filters['selected_date'] !== null, function (Builder $query) use ($filters): void {
                $query->whereDate('orders.event_date', $filters['selected_date']);
            })
            ->when($filters['search'] !== '', function (Builder $query) use ($filters): void {
                $this->applySearch($query, $filters['search']);
            })
            ->when($filters['payment_status'] !== 'all', function (Builder $query) use ($filters): void {
                if ($filters['payment_status'] === 'ready') {
                    $query->whereIn('orders.payment_status', self::ReadyPaymentStatuses);
                } else {
                    $query->where('orders.payment_status', $filters['payment_status']);
                }
            })
            ->when($filters['event_date_from'] !== null, function (Builder $query) use ($filters): void {
                $query->whereDate('orders.event_date', '>=', $filters['event_date_from']);
            })
            ->when($filters['event_date_to'] !== null, function (Builder $query) use ($filters): void {
                $query->whereDate('orders.event_date', '<=', $filters['event_date_to']);
            });
    }

    private function applySearch(Builder $query, string $search): void
    {
        $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('orders.order_code', 'like', "%{$search}%")
                ->orWhere('orders.customer_name', 'like', "%{$search}%")
                ->orWhere('orders.phone', 'like', "%{$search}%")
                ->orWhere('orders.event_name', 'like', "%{$search}%")
                ->orWhere('orders.recipient_name', 'like', "%{$search}%")
                ->orWhere('orders.recipient_phone', 'like', "%{$search}%")
                ->orWhere('orders.event_address', 'like', "%{$search}%");
        });
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

    /**
     * @param  array{sort_by: string, sort_dir: string}  $filters
     */
    private function applySort(Builder $query, array $filters): Builder
    {
        $direction = $filters['sort_dir'];

        match ($filters['sort_by']) {
            'customer_name' => $query
                ->orderBy('orders.customer_name', $direction)
                ->orderBy('orders.event_date')
                ->orderBy('orders.event_time'),
            'status' => $query
                ->orderBy('orders.status', $direction)
                ->orderBy('orders.event_date')
                ->orderBy('orders.event_time'),
            'total_price' => $query
                ->orderBy('orders.total_price', $direction)
                ->orderBy('orders.event_date')
                ->orderBy('orders.event_time'),
            'created_at' => $query
                ->orderBy('orders.created_at', $direction)
                ->orderByDesc('orders.id'),
            default => $query
                ->orderBy('orders.event_date', $direction)
                ->orderBy('orders.event_time', $direction)
                ->orderBy('orders.id', $direction),
        };

        return $query;
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(Order $order, CarbonImmutable $today): array
    {
        return [
            'id' => $order->id,
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
            'recipient_name' => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
            'subtotal' => $order->subtotal,
            'total_price' => $order->total_price,
            'payment_type' => $order->payment_type,
            'dp_amount' => $order->dp_amount,
            'remaining_amount' => $order->remaining_amount,
            'payment_status' => $order->payment_status,
            'status' => $order->status,
            'schedule_state' => $this->scheduleState($order, $today),
            'items' => $this->serializeItems($order),
            'order_items' => $order->items
                ->map(fn (OrderItem $item): array => $this->serializeOrderItem($item))
                ->values()
                ->all(),
            'payments' => $order->payments
                ->map(fn (Payment $payment): array => $this->serializePayment($payment))
                ->values()
                ->all(),
            'created_by_admin' => $order->createdByAdmin ? [
                'id' => $order->createdByAdmin->id,
                'name' => $order->createdByAdmin->name,
            ] : null,
        ];
    }

    /**
     * @return array<int, array{id: string, image_url: string|null, name: string, package_name: string|null, qty: int, source: string}>
     */
    private function serializeItems(Order $order): array
    {
        $rows = [];

        foreach ($order->items as $item) {
            foreach ($this->serializeItemRows($item) as $row) {
                $rows[] = $row;
            }
        }

        return $rows;
    }

    /**
     * @return array<int, array{id: string, image_url: string|null, name: string, package_name: string|null, qty: int, source: string}>
     */
    private function serializeItemRows(OrderItem $item): array
    {
        if ($item->item_type === 'package') {
            return $this->serializePackageItemRows($item);
        }

        $name = trim((string) $item->name_snapshot);

        if ($name === '') {
            return [];
        }

        return [
            [
                'id' => "order-item-{$item->id}",
                'image_url' => $item->menuItem?->primaryImage?->image_url,
                'name' => $name,
                'package_name' => null,
                'qty' => $item->qty,
                'source' => 'direct',
            ],
        ];
    }

    /**
     * @return array<int, array{id: string, image_url: string|null, name: string, package_name: string|null, qty: int, source: string}>
     */
    private function serializePackageItemRows(OrderItem $item): array
    {
        $rows = [];

        foreach ($item->selected_items ?? [] as $index => $selectedItem) {
            $name = $this->selectedItemName($selectedItem);

            if ($name === '') {
                continue;
            }

            $rows[] = [
                'id' => "order-item-{$item->id}-selected-{$index}",
                'image_url' => $item->package?->primaryImage?->image_url,
                'name' => $name,
                'package_name' => $item->package?->name ?? $item->name_snapshot,
                'qty' => $item->qty,
                'source' => 'package_content',
            ];
        }

        if ($rows !== []) {
            return $rows;
        }

        return [];
    }

    private function selectedItemName(mixed $selectedItem): string
    {
        if (! is_array($selectedItem)) {
            return '';
        }

        return trim((string) ($selectedItem['name'] ?? ''));
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeOrderItem(OrderItem $item): array
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

    private function normalizeMonth(mixed $value): string
    {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}$/', $value) === 1) {
            try {
                return CarbonImmutable::createFromFormat('Y-m', $value)->format('Y-m');
            } catch (\Throwable) {
                return CarbonImmutable::today()->format('Y-m');
            }
        }

        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
            try {
                return CarbonImmutable::parse($value)->format('Y-m');
            } catch (\Throwable) {
                return CarbonImmutable::today()->format('Y-m');
            }
        }

        return CarbonImmutable::today()->format('Y-m');
    }

    private function normalizeSelectedDate(mixed $value, string $month): ?string
    {
        $date = filled($value) ? (string) $value : CarbonImmutable::today()->toDateString();

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) !== 1) {
            return null;
        }

        try {
            $date = CarbonImmutable::parse($date)->toDateString();
        } catch (\Throwable) {
            return null;
        }

        if (! str_starts_with($date, "{$month}-")) {
            return null;
        }

        return $date;
    }

    private function normalizeDateFilter(mixed $value): ?string
    {
        if (! is_string($value) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        try {
            return CarbonImmutable::createFromFormat('Y-m-d', $value)->toDateString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function formatDateLabel(CarbonImmutable $date): string
    {
        return $date->locale('id')->isoFormat('dddd, D MMMM YYYY');
    }

    private function scheduleState(Order $order, CarbonImmutable $today): string
    {
        if ($order->status === 'canceled') {
            return 'canceled';
        }

        if ($order->event_date?->lt($today)) {
            return 'overdue';
        }

        if ($order->event_date?->isSameDay($today)) {
            return 'today';
        }

        return 'upcoming';
    }

    private function formatTimeValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return substr((string) $value, 0, 5);
    }
}
