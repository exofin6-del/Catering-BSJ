<?php

namespace Tests\Feature\Report;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_guest_cannot_access_reports(): void
    {
        $this->get(route('report.index'))->assertRedirect(route('login'));
        $this->get(route('report.sales'))->assertRedirect(route('login'));
        $this->get(route('report.export'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_access_report_index(): void
    {
        $user = User::factory()->create();

        // Create completed and paid order to verify report data
        $order = Order::query()->create([
            'customer_name' => 'Budi Santoso',
            'event_address' => 'Jl. Mawar No. 1',
            'event_date' => now()->subDay()->toDateString(),
            'event_name' => 'Rapat kantor',
            'event_time' => '09:00',
            'order_code' => 'ORD-EXP-001',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567890',
            'status' => 'completed',
            'subtotal' => 1500000,
            'total_price' => 1500000,
            'remaining_amount' => 0,
        ]);

        Payment::query()->create([
            'order_id' => $order->id,
            'amount' => 1500000,
            'paid_at' => now(),
            'method' => 'transfer',
            'type' => 'full',
        ]);

        $this->actingAs($user)
            ->get(route('report.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/reports/index')
                ->has('summary')
                ->where('summary.order_count', 1)
                ->where('summary.total_revenue', 1500000)
            );
    }

    public function test_authenticated_user_can_access_report_sales(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('report.sales'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/reports/sales')
            );
    }

    public function test_authenticated_user_can_export_report_csv(): void
    {
        $user = User::factory()->create();

        $order = Order::query()->create([
            'customer_name' => 'Budi Santoso',
            'event_address' => 'Jl. Mawar No. 1',
            'event_date' => now()->subDay()->toDateString(),
            'event_name' => 'Rapat kantor',
            'event_time' => '09:00',
            'order_code' => 'ORD-EXP-001',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567890',
            'status' => 'completed',
            'subtotal' => 2000000,
            'total_price' => 2000000,
            'remaining_amount' => 0,
        ]);

        Payment::query()->create([
            'order_id' => $order->id,
            'amount' => 2000000,
            'paid_at' => now(),
            'method' => 'cash',
            'type' => 'full',
        ]);

        $response = $this->actingAs($user)
            ->get(route('report.export', ['period' => 'all']))
            ->assertOk();

        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('ORD-EXP-001', $response->streamedContent());
    }

    public function test_authenticated_user_can_fetch_report_export_data_as_json(): void
    {
        $user = User::factory()->create();

        $order = Order::query()->create([
            'customer_name' => 'Siti Rahma',
            'event_address' => 'Jl. Melati No. 2',
            'event_date' => now()->subDay()->toDateString(),
            'event_name' => 'Acara keluarga',
            'event_time' => '10:00',
            'order_code' => 'ORD-JSON-001',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567891',
            'status' => 'completed',
            'subtotal' => 1750000,
            'total_price' => 1750000,
            'remaining_amount' => 0,
        ]);

        Payment::query()->create([
            'order_id' => $order->id,
            'amount' => 1750000,
            'paid_at' => now(),
            'method' => 'transfer',
            'type' => 'full',
        ]);

        $this->actingAs($user)
            ->getJson(route('report.export', ['period' => 'all']))
            ->assertOk()
            ->assertJsonPath('filters.period', 'all')
            ->assertJsonPath('summary.order_count', 1)
            ->assertJsonPath('orders.data.0.order_code', 'ORD-JSON-001');
    }
}
