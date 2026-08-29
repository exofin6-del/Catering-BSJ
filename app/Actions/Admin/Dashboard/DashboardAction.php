<?php

namespace App\Actions\Admin\Dashboard;

use App\Models\BusinessSetting;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Package;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class DashboardAction
{
    private const ReadyPaymentStatuses = ['dp_paid', 'paid'];

    /**
     * @return array<string, mixed>
     */
    public function pageProps(): array
    {
        $today = CarbonImmutable::today();

        return [
            'stats' => $this->stats($today),
            'orderTraffic' => $this->orderTraffic($today),
            'upcomingOrders' => $this->upcomingOrders($today),
            'statusSummary' => $this->statusSummary(),
            'dailyLoads' => $this->dailyLoads($today),
        ];
    }

    /**
     * @return array{total_orders: int, today_orders: int, pending_confirmation: int, need_payment: int, upcoming_orders: int, completed_this_month: int, revenue_this_month: string, outstanding_balance: string, active_menu_items: int, active_packages: int}
     */
    public function stats(CarbonImmutable $today): array
    {
        $monthStart = $today->startOfMonth()->startOfDay();
        $now = $today->endOfDay();

        $stats = Order::query()
            ->selectRaw('COUNT(*) as total_orders')
            ->selectRaw("SUM(CASE WHEN DATE(event_date) = ? AND status = 'confirmed' THEN 1 ELSE 0 END) as today_orders", [$today->toDateString()])
            ->selectRaw("SUM(CASE WHEN status = 'pending_confirmation' THEN 1 ELSE 0 END) as pending_confirmation")
            ->selectRaw("SUM(CASE WHEN status != 'canceled' AND payment_status != 'paid' THEN 1 ELSE 0 END) as need_payment")
            ->selectRaw("SUM(CASE WHEN status = 'confirmed' AND DATE(event_date) >= ? THEN 1 ELSE 0 END) as upcoming_orders", [$today->toDateString()])
            ->selectRaw("SUM(CASE WHEN status = 'completed' AND created_at >= ? THEN 1 ELSE 0 END) as completed_this_month", [$monthStart->toDateTimeString()])
            ->selectRaw('SUM(CASE WHEN status != ? AND created_at BETWEEN ? AND ? THEN total_price ELSE 0 END) as revenue_this_month', ['canceled', $monthStart->toDateTimeString(), $now->toDateTimeString()])
            ->selectRaw("SUM(CASE WHEN status != 'canceled' AND payment_status = 'unpaid' THEN total_price WHEN status != 'canceled' AND payment_status = 'dp_paid' THEN remaining_amount ELSE 0 END) as outstanding_balance")
            ->first();

        return [
            'total_orders' => (int) ($stats?->total_orders ?? 0),
            'today_orders' => (int) ($stats?->today_orders ?? 0),
            'pending_confirmation' => (int) ($stats?->pending_confirmation ?? 0),
            'need_payment' => (int) ($stats?->need_payment ?? 0),
            'upcoming_orders' => (int) ($stats?->upcoming_orders ?? 0),
            'completed_this_month' => (int) ($stats?->completed_this_month ?? 0),
            'revenue_this_month' => $this->decimal($stats?->revenue_this_month),
            'outstanding_balance' => $this->decimal($stats?->outstanding_balance),
            'active_menu_items' => MenuItem::query()->active()->count(),
            'active_packages' => Package::query()->active()->count(),
        ];
    }

    /**
     * @return array<int, array{date: string, orders: int, revenue: string}>
     */
    public function orderTraffic(CarbonImmutable $today): array
    {
        $start = $today->subDays(13)->startOfDay();
        $end = $today->endOfDay();

        /** @var Collection<string, Order> $ordersByDate */
        $ordersByDate = Order::query()
            ->selectRaw('DATE(created_at) as bucket_date')
            ->selectRaw('COUNT(*) as orders_count')
            ->selectRaw('SUM(total_price) as revenue_total')
            ->whereBetween('created_at', [$start->toDateTimeString(), $end->toDateTimeString()])
            ->groupByRaw('DATE(created_at)')
            ->get()
            ->keyBy('bucket_date');

        return collect(range(0, 13))
            ->map(function (int $offset) use ($start, $ordersByDate): array {
                $date = $start->addDays($offset)->toDateString();
                $row = $ordersByDate->get($date);

                return [
                    'date' => $date,
                    'orders' => (int) ($row?->orders_count ?? 0),
                    'revenue' => $this->decimal($row?->revenue_total),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function upcomingOrders(CarbonImmutable $today): array
    {
        return Order::query()
            ->select('orders.*')
            ->whereDate('orders.event_date', '>=', $today->toDateString())
            ->where('orders.status', 'confirmed')
            ->orderBy('orders.event_date')
            ->orderBy('orders.event_time')
            ->orderBy('orders.id')
            ->limit(5)
            ->get()
            ->map(fn (Order $order): array => $this->serializeUpcomingOrder($order))
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: int, tone: string}>
     */
    public function statusSummary(): array
    {
        $stats = Order::query()
            ->selectRaw("SUM(CASE WHEN status = 'pending_confirmation' THEN 1 ELSE 0 END) as pending_confirmation")
            ->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status = 'canceled' THEN 1 ELSE 0 END) as canceled")
            ->first();

        return [
            [
                'label' => 'Menunggu',
                'value' => (int) ($stats?->pending_confirmation ?? 0),
                'tone' => 'amber',
            ],
            [
                'label' => 'Terkonfirmasi',
                'value' => (int) ($stats?->confirmed ?? 0),
                'tone' => 'violet',
            ],
            [
                'label' => 'Selesai',
                'value' => (int) ($stats?->completed ?? 0),
                'tone' => 'emerald',
            ],
            [
                'label' => 'Dibatalkan',
                'value' => (int) ($stats?->canceled ?? 0),
                'tone' => 'rose',
            ],
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, start_time: string, end_time: string, order_count: int, capacity: int}>
     */
    public function dailyLoads(CarbonImmutable $today): array
    {
        $startDate = $today->toDateString();
        $endDate = $today->addDays(6)->toDateString();
        $setting = $this->businessSetting();
        $capacity = max(1, (int) $setting->max_orders_per_day);

        /** @var Collection<string, Order> $ordersByDate */
        $ordersByDate = Order::query()
            ->selectRaw('DATE(event_date) as event_day')
            ->selectRaw('COUNT(*) as order_count')
            ->whereDate('event_date', '>=', $startDate)
            ->whereDate('event_date', '<=', $endDate)
            ->where('status', 'confirmed')
            ->groupByRaw('DATE(event_date)')
            ->get()
            ->keyBy('event_day');

        return collect(range(0, 6))
            ->map(function (int $offset) use ($today, $ordersByDate, $setting, $capacity): array {
                $date = $today->addDays($offset);
                $row = $ordersByDate->get($date->toDateString());

                return [
                    'id' => $offset,
                    'name' => $offset === 0 ? 'Hari ini' : $date->translatedFormat('d M'),
                    'start_time' => $this->formatTimeValue($setting->operational_start_time),
                    'end_time' => $this->formatTimeValue($setting->operational_end_time),
                    'order_count' => (int) ($row?->order_count ?? 0),
                    'capacity' => $capacity,
                ];
            })
            ->all();
    }

    /**
     * @return array{id: int, order_code: string, customer_name: string, event_name: string, event_date: string|null, event_time: string, phone: string, status: string, payment_status: string, total_price: string, remaining_amount: string}
     */
    private function serializeUpcomingOrder(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'customer_name' => $order->customer_name,
            'event_name' => $order->event_name,
            'event_date' => $order->event_date?->toDateString(),
            'event_time' => $this->formatTimeValue($order->event_time),
            'phone' => $order->phone,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'total_price' => $this->decimal($order->total_price),
            'remaining_amount' => $this->decimal($order->remaining_amount),
        ];
    }

    private function businessSetting(): BusinessSetting
    {
        $setting = BusinessSetting::query()->first();

        return $setting instanceof BusinessSetting ? $setting : new BusinessSetting;
    }

    private function decimal(mixed $value): string
    {
        return number_format((float) ($value ?? 0), 2, '.', '');
    }

    private function formatTimeValue(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        return substr((string) $value, 0, 5);
    }
}
