<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->has('stats', fn (Assert $stats) => $stats
                    ->where('total_orders', 0)
                    ->where('today_orders', 0)
                    ->where('pending_confirmation', 0)
                    ->where('need_payment', 0)
                    ->where('upcoming_orders', 0)
                    ->where('completed_this_month', 0)
                    ->where('revenue_this_month', '0.00')
                    ->where('outstanding_balance', '0.00')
                    ->where('active_menu_items', 0)
                    ->where('active_packages', 0)
                )
                ->has('orderTraffic', 14)
                ->has('statusSummary', 4)
                ->has('dailyLoads', 7)
                ->has('upcomingOrders', 0)
            );
    }

    public function test_completed_and_canceled_orders_are_excluded_from_upcoming_schedule(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // 1. Confirmed upcoming order tomorrow (should show up)
        Order::query()->create([
            'customer_name' => 'John Doe',
            'event_address' => 'Jl. Kebon Jeruk No. 5',
            'event_date' => now()->addDay()->toDateString(),
            'event_name' => 'Ulang Tahun confirmed',
            'event_time' => '10:00',
            'order_code' => 'ORD-CONFIRMED',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567890',
            'status' => 'confirmed',
            'subtotal' => 150000,
            'total_price' => 150000,
        ]);

        // 2. Completed order tomorrow (should NOT show up)
        Order::query()->create([
            'customer_name' => 'Alice completed',
            'event_address' => 'Jl. Kebon Sirih No. 10',
            'event_date' => now()->addDay()->toDateString(),
            'event_name' => 'Ulang Tahun completed',
            'event_time' => '11:00',
            'order_code' => 'ORD-COMPLETED',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567891',
            'status' => 'completed',
            'subtotal' => 150000,
            'total_price' => 150000,
        ]);

        // 3. Canceled order tomorrow (should NOT show up)
        Order::query()->create([
            'customer_name' => 'Bob canceled',
            'event_address' => 'Jl. Kebon Kacang No. 15',
            'event_date' => now()->addDay()->toDateString(),
            'event_name' => 'Ulang Tahun canceled',
            'event_time' => '12:00',
            'order_code' => 'ORD-CANCELED',
            'payment_status' => 'paid',
            'payment_type' => 'full',
            'phone' => '081234567892',
            'status' => 'canceled',
            'subtotal' => 150000,
            'total_price' => 150000,
        ]);

        $response = $this->get(route('dashboard'));
        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.upcoming_orders', 1) // Only ORD-CONFIRMED counted
                ->has('upcomingOrders', 1)          // Only ORD-CONFIRMED returned
                ->where('upcomingOrders.0.order_code', 'ORD-CONFIRMED')
            );
    }
}
