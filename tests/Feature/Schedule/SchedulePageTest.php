<?php

namespace Tests\Feature\Schedule;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SchedulePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get(route('schedule.index'))->assertRedirect(route('login'));
    }

    public function test_only_confirmed_orders_appear(): void
    {
        $this->actingAs(User::factory()->create());
        $eventDate = now()->addDay()->toDateString();

        $dpOrder = $this->createOrder('ORD-DP', 'confirmed', 'dp_paid', $eventDate);
        $paidOrder = $this->createOrder('ORD-PAID', 'confirmed', 'paid', $eventDate);
        $unpaidOrder = $this->createOrder('ORD-UNPAID', 'confirmed', 'unpaid', $eventDate);
        $this->createOrder('ORD-PENDING', 'pending_confirmation', 'paid', $eventDate);
        $this->createOrder('ORD-COMPLETED', 'completed', 'paid', $eventDate);
        $this->createOrder('ORD-CANCELED', 'canceled', 'paid', $eventDate);

        $this->get(route('schedule.index', [
            'month' => now()->addDay()->format('Y-m'),
            'selected_date' => $eventDate,
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/schedules/index')
                ->where('stats.total', 3)
                ->has('items.data', 3)
                ->where('items.data.0.id', $dpOrder->id)
                ->where('items.data.1.id', $paidOrder->id)
                ->where('items.data.2.id', $unpaidOrder->id)
            );
    }

    public function test_completed_order_disappears_from_schedule(): void
    {
        $this->actingAs(User::factory()->create());
        $eventDate = now()->addDay()->toDateString();
        $order = $this->createOrder('ORD-FINISH', 'confirmed', 'paid', $eventDate);

        $this->get(route('schedule.index', [
            'month' => now()->addDay()->format('Y-m'),
            'selected_date' => $eventDate,
        ]))
            ->assertInertia(fn (Assert $page) => $page->has('items.data', 1));

        $order->update(['status' => 'completed']);

        $this->get(route('schedule.index', [
            'month' => now()->addDay()->format('Y-m'),
            'selected_date' => $eventDate,
        ]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total', 0)
                ->has('items.data', 0)
            );
    }

    public function test_schedule_export_json_supports_a_custom_date_range_across_months(): void
    {
        $this->actingAs(User::factory()->create());

        $firstOrder = $this->createOrder('ORD-RANGE-1', 'confirmed', 'paid', '2026-07-31');
        $secondOrder = $this->createOrder('ORD-RANGE-2', 'confirmed', 'dp_paid', '2026-08-01');
        $this->createOrder('ORD-OUTSIDE', 'confirmed', 'paid', '2026-08-02');

        $this->getJson(route('schedule.export', [
            'event_date_from' => '2026-07-31',
            'event_date_to' => '2026-08-01',
            'scope' => 'all',
        ]))
            ->assertOk()
            ->assertJsonCount(2, 'items')
            ->assertJsonPath('items.0.id', $firstOrder->id)
            ->assertJsonPath('items.1.id', $secondOrder->id);
    }

    public function test_schedule_export_json_can_include_all_schedule_dates(): void
    {
        $this->actingAs(User::factory()->create());

        $pastOrder = $this->createOrder('ORD-ALL-PAST', 'confirmed', 'paid', '2025-01-15');
        $futureOrder = $this->createOrder('ORD-ALL-FUTURE', 'confirmed', 'dp_paid', '2027-12-20');
        $unpaidOrder = $this->createOrder('ORD-ALL-UNPAID', 'confirmed', 'unpaid', '2026-07-13');

        $this->getJson(route('schedule.export', [
            'export_period' => 'all',
            'scope' => 'all',
        ]))
            ->assertOk()
            ->assertJsonCount(3, 'items')
            ->assertJsonPath('items.0.id', $pastOrder->id)
            ->assertJsonPath('items.1.id', $unpaidOrder->id)
            ->assertJsonPath('items.2.id', $futureOrder->id);
    }

    public function test_schedule_csv_export_uses_the_clean_location_columns(): void
    {
        $this->actingAs(User::factory()->create());

        $order = $this->createOrder('ORD-CSV', 'confirmed', 'paid', '2026-07-19');
        $order->update([
            'address_name' => 'Gedung Serbaguna',
            'latitude' => '-6.2000000',
            'longitude' => '106.8166660',
        ]);

        $response = $this->get(route('schedule.export', [
            'export_period' => 'all',
            'scope' => 'all',
        ]))->assertOk();

        $csv = $response->streamedContent();

        $this->assertStringContainsString('Jam,Alamat,Lokasi,Total', $csv);
        $this->assertStringContainsString('Gedung Serbaguna', $csv);
        $this->assertStringContainsString(
            'https://www.google.com/maps/search/?api=1&query=-6.2%2C106.816666',
            $csv,
        );
        $this->assertStringNotContainsString('"Kode"', $csv);
        $this->assertStringNotContainsString('"Tanggal Acara"', $csv);
    }

    private function createOrder(string $code, string $status, string $paymentStatus, string $eventDate): Order
    {
        return Order::query()->create([
            'customer_name' => "Pelanggan {$code}",
            'event_address' => 'Jl. Contoh No. 1',
            'event_date' => $eventDate,
            'event_name' => "Acara {$code}",
            'event_time' => '10:00',
            'order_code' => $code,
            'payment_status' => $paymentStatus,
            'payment_type' => $paymentStatus === 'paid' ? 'full' : 'dp',
            'phone' => '081234567890',
            'status' => $status,
            'subtotal' => 150000,
            'total_price' => 150000,
        ]);
    }
}
