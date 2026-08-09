<?php

namespace App\Actions\Report;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ReportAction
{
    private const int POPULAR_ITEM_LIMIT = 3;

    private const string REPORTABLE_PAYMENT_STATUS = 'paid';

    private const string REPORTABLE_STATUS = 'completed';

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function getReportData(array $filters): array
    {
        [$startDate, $endDate] = $this->dateRange($filters);

        $orders = $this->ordersQuery($startDate, $endDate);
        $totalRevenue = (float) (clone $orders)->sum('total_price');
        $orderCount = (int) (clone $orders)->count();
        $totalReceivable = (float) (clone $orders)->sum('remaining_amount');
        $totalPaid = (float) Payment::query()
            ->whereHas('order', function (Builder $query) use ($startDate, $endDate): void {
                $this->applyReportableOrderConstraints($query, $startDate, $endDate);
            })
            ->sum('amount');
        $orderHistory = $this->orderHistory($startDate, $endDate);
        $highestOrderDateTotal = $this->highestOrderDateTotal($orderHistory['data']);

        return [
            'filters' => [
                'end_date' => $endDate->toDateString(),
                'period' => $this->period($filters),
                'start_date' => $startDate->toDateString(),
            ],
            'orders' => $orderHistory,
            'summary' => [
                'average_order_value' => $orderCount > 0
                    ? $totalRevenue / $orderCount
                    : 0,
                'highest_order_date' => $highestOrderDateTotal['date'],
                'highest_order_value' => $highestOrderDateTotal['value'],
                'order_count' => $orderCount,
                'total_paid' => $totalPaid,
                'total_receivable' => $totalReceivable,
                'total_revenue' => $totalRevenue,
            ],
            'status_breakdown' => $this->statusBreakdown($startDate, $endDate),
            'payment_breakdown' => $this->paymentBreakdown($startDate, $endDate),
            'popular_menu_items' => $this->popularItems($startDate, $endDate, 'menu_item'),
            'popular_packages' => $this->popularItems($startDate, $endDate, 'package'),
            'recent_payments' => $this->recentPayments($startDate, $endDate),
        ];
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function exportOrders(array $filters): array
    {
        [$startDate, $endDate] = $this->dateRange($filters);

        return $this->ordersQuery($startDate, $endDate)
            ->limit(5000)
            ->get()
            ->map(fn (Order $order): array => $this->orderRow($order))
            ->all();
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{CarbonImmutable, CarbonImmutable}
     */
    private function dateRange(array $filters): array
    {
        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            return [
                CarbonImmutable::parse((string) $filters['start_date']),
                CarbonImmutable::parse((string) $filters['end_date']),
            ];
        }

        $now = CarbonImmutable::now();

        return match ($this->period($filters)) {
            'all' => [$this->firstOrderDate($now), $now->endOfDay()],
            'daily' => [$now->startOfDay(), $now->endOfDay()],
            'weekly' => [$now->startOfWeek(), $now->endOfWeek()],
            'yearly' => [$now->startOfYear(), $now->endOfYear()],
            default => [$now->startOfMonth(), $now->endOfMonth()],
        };
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function period(array $filters): string
    {
        $period = (string) ($filters['period'] ?? 'monthly');

        return in_array($period, ['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'], true)
            ? $period
            : 'monthly';
    }

    private function firstOrderDate(CarbonImmutable $fallback): CarbonImmutable
    {
        $createdAt = Payment::query()->oldest('paid_at')->value('paid_at');

        return $createdAt
            ? CarbonImmutable::parse((string) $createdAt)->startOfDay()
            : $fallback->startOfDay();
    }

    /**
     * @return Builder<Order>
     */
    private function ordersQuery(CarbonImmutable $startDate, CarbonImmutable $endDate): Builder
    {
        return Order::query()
            ->withCount('items')
            ->withMax('payments as latest_payment_at', 'paid_at')
            ->withSum('payments as paid_amount', 'amount')
            ->with(['items.menuItem.category', 'items.menuItem.primaryImage', 'items.package.category', 'items.package.primaryImage', 'payments'])
            ->where('status', self::REPORTABLE_STATUS)
            ->where('payment_status', self::REPORTABLE_PAYMENT_STATUS)
            ->whereRaw(
                '(select max(`paid_at`) from `payments` where `payments`.`order_id` = `orders`.`id`) between ? and ?',
                [$startDate->startOfDay()->toDateTimeString(), $endDate->endOfDay()->toDateTimeString()],
            )
            ->orderByDesc('latest_payment_at')
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }

    /**
     * @return array<string, mixed>
     */
    private function orderHistory(CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        $orders = $this->ordersQuery($startDate, $endDate)->get();

        return [
            'data' => $orders
                ->map(fn (Order $order): array => $this->orderRow($order))
                ->values()
                ->all(),
            'total_orders' => $orders->count(),
        ];
    }

    /**
     * @return array{date: string|null, value: float}
     */
    /**
     * @param  array<int, array<string, mixed>>  $orders
     * @return array{date: string|null, value: float}
     */
    private function highestOrderDateTotal(array $orders): array
    {
        $totals = [];

        foreach ($orders as $order) {
            if (empty($order['latest_payment_at'])) {
                continue;
            }

            $paidDate = CarbonImmutable::parse((string) $order['latest_payment_at'])->toDateString();
            $totals[$paidDate] = ($totals[$paidDate] ?? 0) + (float) $order['total_price'];
        }

        if ($totals === []) {
            return [
                'date' => null,
                'value' => 0.0,
            ];
        }

        uksort($totals, function (string $firstDate, string $secondDate) use ($totals): int {
            return $totals[$secondDate] <=> $totals[$firstDate]
                ?: strcmp($secondDate, $firstDate);
        });

        $date = array_key_first($totals);

        return [
            'date' => $date,
            'value' => (float) $totals[$date],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function orderRow(Order $order): array
    {
        /** @var array<int, array<string, mixed>> $resolvedPackageSelections */
        $resolvedPackageSelections = $this->resolvePackageSelections($order);

        return [
            'address_name' => $order->address_name,
            'created_at' => $order->created_at?->toDateTimeString(),
            'customer_name' => $order->customer_name,
            'event_address' => $order->event_address,
            'event_date' => $order->event_date?->toDateString(),
            'event_name' => $order->event_name,
            'event_time' => $order->event_time ? substr((string) $order->event_time, 0, 5) : null,
            'id' => $order->id,
            'latitude' => $order->latitude,
            'longitude' => $order->longitude,
            'notes' => $order->notes,
            'phone' => $order->phone,
            'items_count' => (int) ($order->items_count ?? 0),
            'items' => $order->items->map(fn (OrderItem $item): array => [
                'id' => $item->id,
                'item_type' => $item->item_type,
                'name_snapshot' => $item->name_snapshot,
                'price_snapshot' => (float) $item->price_snapshot,
                'qty' => $item->qty,
                'subtotal' => (float) $item->subtotal,
                'selected_items' => $item->item_type === 'package'
                    ? ($resolvedPackageSelections[$item->id] ?? $item->selected_items)
                    : $item->selected_items,
                'menu_item' => $item->menuItem ? [
                    'id' => $item->menuItem->id,
                    'name' => $item->menuItem->name,
                    'primary_image' => $item->menuItem->primaryImage?->image_url,
                    'menu_category' => $item->menuItem->category ? [
                        'name' => $item->menuItem->category->name,
                    ] : null,
                ] : null,
                'package' => $item->package ? [
                    'id' => $item->package->id,
                    'name' => $item->package->name,
                    'primary_image' => $item->package->primaryImage?->image_url,
                    'package_category' => $item->package->category ? [
                        'name' => $item->package->category->name,
                    ] : null,
                ] : null,
            ])->values()->all(),
            'latest_payment_at' => $order->latest_payment_at
                ? CarbonImmutable::parse((string) $order->latest_payment_at)->toDateTimeString()
                : null,
            'order_code' => $order->order_code,
            'paid_amount' => (float) ($order->paid_amount ?? 0),
            'payment_status' => $order->payment_status,
            'payments' => $order->payments->map(fn (Payment $payment): array => [
                'id' => $payment->id,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'type' => $payment->type,
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'proof_image' => $payment->proof_image,
            ])->values()->all(),
            'remaining_amount' => (float) $order->remaining_amount,
            'status' => $order->status,
            'subtotal' => (float) $order->subtotal,
            'total_price' => (float) $order->total_price,
        ];
    }

    /**
     * @return array<string, array{count: int, total_amount: float}>
     */
    private function statusBreakdown(CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        $statusRows = Order::query()
            ->whereBetween('created_at', [$startDate->startOfDay(), $endDate->endOfDay()])
            ->where('status', self::REPORTABLE_STATUS)
            ->where('payment_status', self::REPORTABLE_PAYMENT_STATUS)
            ->whereRaw(
                '(select max(`paid_at`) from `payments` where `payments`.`order_id` = `orders`.`id`) between ? and ?',
                [$startDate->startOfDay()->toDateTimeString(), $endDate->endOfDay()->toDateTimeString()],
            )
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(total_price) as total_amount'))
            ->groupBy('status')
            ->get()
            ->keyBy('status')
            ->map(fn ($row): array => [
                'count' => (int) $row->count,
                'total_amount' => (float) $row->total_amount,
            ])
            ->all();

        foreach (['pending_confirmation', 'confirmed', 'completed', 'canceled'] as $status) {
            $statusRows[$status] ??= [
                'count' => 0,
                'total_amount' => 0.0,
            ];
        }

        return $statusRows;
    }

    /**
     * @return array<int, array{method: string, count: int, total_amount: float}>
     */
    private function paymentBreakdown(CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        return Payment::query()
            ->whereHas('order', function (Builder $query) use ($startDate, $endDate): void {
                $this->applyReportableOrderConstraints($query, $startDate, $endDate);
            })
            ->select(DB::raw("coalesce(method, 'manual') as method"), DB::raw('count(*) as count'), DB::raw('sum(amount) as total_amount'))
            ->groupBy('method')
            ->orderByDesc('total_amount')
            ->get()
            ->map(fn ($row): array => [
                'count' => (int) $row->count,
                'method' => (string) $row->method,
                'total_amount' => (float) $row->total_amount,
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int|null, name: string, qty: int, revenue: float}>
     */
    private function popularItems(CarbonImmutable $startDate, CarbonImmutable $endDate, string $itemType): array
    {
        $foreignKey = $itemType === 'package' ? 'package_id' : 'menu_item_id';

        return OrderItem::query()
            ->whereHas('order', function (Builder $query) use ($startDate, $endDate): void {
                $this->applyReportableOrderConstraints($query, $startDate, $endDate);
            })
            ->where('item_type', $itemType)
            ->select($foreignKey, 'name_snapshot', DB::raw('sum(qty) as total_qty'), DB::raw('sum(subtotal) as total_revenue'))
            ->groupBy($foreignKey, 'name_snapshot')
            ->orderByDesc('total_qty')
            ->limit(self::POPULAR_ITEM_LIMIT)
            ->get()
            ->map(fn ($row): array => [
                'id' => $row->{$foreignKey},
                'name' => $row->name_snapshot ?? ($itemType === 'package' ? 'Paket dihapus' : 'Menu dihapus'),
                'qty' => (int) $row->total_qty,
                'revenue' => (float) $row->total_revenue,
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, order_code: string, customer_name: string, type: string, method: string|null, amount: float, paid_at: string|null}>
     */
    private function recentPayments(CarbonImmutable $startDate, CarbonImmutable $endDate): array
    {
        return Payment::query()
            ->with('order:id,order_code,customer_name')
            ->whereHas('order', function (Builder $query) use ($startDate, $endDate): void {
                $this->applyReportableOrderConstraints($query, $startDate, $endDate);
            })
            ->orderByDesc('paid_at')
            ->limit(10)
            ->get()
            ->map(fn (Payment $payment): array => [
                'amount' => (float) $payment->amount,
                'customer_name' => $payment->order?->customer_name ?? '-',
                'id' => $payment->id,
                'method' => $payment->method,
                'order_code' => $payment->order?->order_code ?? '-',
                'paid_at' => $payment->paid_at?->toDateTimeString(),
                'type' => $payment->type,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function resolvePackageSelections(Order $order): array
    {
        $packageItemIds = $order->items
            ->where('item_type', 'package')
            ->pluck('selected_items')
            ->flatten(1)
            ->pluck('menu_item_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($packageItemIds === []) {
            return [];
        }

        /** @var array<int, MenuItem> $menuItems */
        $menuItems = MenuItem::query()
            ->whereIn('id', $packageItemIds)
            ->with('primaryImage')
            ->get()
            ->keyBy('id');

        $resolved = [];

        foreach ($order->items->where('item_type', 'package') as $item) {
            $selected = $item->selected_items ?? [];

            $resolved[$item->id] = array_map(function (array $selection) use ($menuItems): array {
                $menuItemId = $selection['menu_item_id'] ?? null;
                $resolvedMenuItem = $menuItemId ? ($menuItems[$menuItemId] ?? null) : null;

                return [
                    'package_item_id' => $selection['package_item_id'] ?? null,
                    'menu_item_id' => $menuItemId,
                    'name' => $selection['name'] ?? 'Menu tidak tersedia',
                    'price' => $selection['price'] ?? 0,
                    'package_item_name' => $selection['package_item_name'] ?? null,
                    'primary_image' => $resolvedMenuItem?->primaryImage?->image_url,
                ];
            }, $selected);

            $resolved[$item->id] = array_values($resolved[$item->id]);
        }

        return $resolved;
    }

    /**
     * @param  Builder<Order>  $query
     */
    private function applyReportableOrderConstraints(Builder $query, CarbonImmutable $startDate, CarbonImmutable $endDate): void
    {
        $query
            ->where('status', self::REPORTABLE_STATUS)
            ->where('payment_status', self::REPORTABLE_PAYMENT_STATUS)
            ->whereRaw(
                '(select max(`paid_at`) from `payments` where `payments`.`order_id` = `orders`.`id`) between ? and ?',
                [$startDate->startOfDay()->toDateTimeString(), $endDate->endOfDay()->toDateTimeString()],
            );
    }
}
