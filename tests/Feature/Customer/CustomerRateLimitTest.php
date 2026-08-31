<?php

namespace Tests\Feature\Customer;

use App\Models\BusinessSetting;
use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Services\CustomerJwtService;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

final class CustomerRateLimitTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        $this->withoutVite();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    /**
     * Skenario: user normal melakukan 3 order beruntun dalam 1 menit.
     *
     * Budget limiter checkout adalah 5x/menit per IP, jadi 3 order yang
     * dikirim beruntun masih di dalam batas dan harus diterima.
     */
    public function test_checkout_allows_three_consecutive_orders_within_one_minute_from_one_account(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();
        $this->withCustomerJwt($this->createCustomer());

        for ($orderNo = 1; $orderNo <= 3; $orderNo++) {
            $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
                ->assertRedirect(route('customerV2.orders'));
        }

        $this->assertDatabaseCount('orders', 3);
    }

    /**
     * Skenario: 4 order dalam 1 hari dari akun customer yang sama (dari IP berbeda).
     * Order ke-4 harus diblokir oleh rate limiter (HTTP 429).
     */
    public function test_checkout_blocks_fourth_order_per_day_from_same_account(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();
        $customer = $this->createCustomer();
        $this->withCustomerJwt($customer);

        for ($orderNo = 1; $orderNo <= 3; $orderNo++) {
            $this->withServerVariables(['HTTP_X_FORWARDED_FOR' => "203.0.113.{$orderNo}"]);
            $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
                ->assertRedirect(route('customerV2.orders'));
        }

        $this->withServerVariables(['HTTP_X_FORWARDED_FOR' => '203.0.113.99']);
        $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
            ->assertStatus(429);
    }

    /**
     * Skenario: lebih dari 5 order dalam 1 menit dari IP yang sama.
     *
     * Order ke-6 harus ditolak oleh throttle (HTTP 429) walaupun setiap
     * percobaan memakai akun customer yang berbeda-beda.
     */
    public function test_checkout_blocks_sixth_order_within_one_minute_from_same_ip(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();

        // Lima akun berbeda (masing-masing 1 order, masih di bawah limit
        // harian 3 order/akun) tetap berbagi budget rate limiter yang sama
        // karena limiter di-key oleh IP, bukan oleh akun.
        for ($orderNo = 1; $orderNo <= 5; $orderNo++) {
            $this->withCustomerJwt($this->createCustomer());

            $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
                ->assertRedirect(route('customerV2.orders'));
        }

        $this->withCustomerJwt($this->createCustomer());

        $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
            ->assertStatus(429);
    }

    /**
     * Skenario: 5 akun "attacker" (rotasi akun) dari IP yang sama.
     *
     * Kelima order pertama diterima, tetapi upaya ke-6 dari akun baru mana pun
     * tetap 429 karena budget rate limiter terbagi antar-akun / per-IP.
     */
    public function test_checkout_rate_limit_budget_is_shared_across_five_attacker_accounts_from_same_ip(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();
        $this->withServerVariables(['HTTP_X_FORWARDED_FOR' => '203.0.113.10']);

        foreach (range(1, 5) as $attempt) {
            $this->withCustomerJwt($this->createCustomer());

            $response = $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem));

            $this->assertNotSame(
                429,
                $response->getStatusCode(),
                "Order ke-{$attempt} dari akun attacker ke-{$attempt} seharusnya lolos.",
            );

            $response->assertRedirect(route('customerV2.orders'));
        }

        // Akun attacker ke-6 (baru) tetap diblokir karena IP sudah habis kuota.
        $this->withCustomerJwt($this->createCustomer());

        $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
            ->assertStatus(429);
    }

    /**
     * Skenario: budget rate limiter dihitung per IP.
     *
     * Setelah budget IP pertama habis (5 order), IP lain tetap bisa checkout.
     */
    public function test_checkout_rate_limit_budget_is_separate_between_different_ips(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();
        $this->withServerVariables(['HTTP_X_FORWARDED_FOR' => '203.0.113.20']);

        for ($orderNo = 1; $orderNo <= 5; $orderNo++) {
            $this->withCustomerJwt($this->createCustomer());

            $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
                ->assertRedirect(route('customerV2.orders'));
        }

        // IP kedua punya budget sendiri → masih diizinkan.
        $this->withServerVariables(['HTTP_X_FORWARDED_FOR' => '203.0.113.21']);
        $this->withCustomerJwt($this->createCustomer());

        $this->post(route('customerV2.storeCheckout'), $this->checkoutPayload($menuItem))
            ->assertRedirect(route('customerV2.orders'));
    }

    private function createBusinessSetting(): BusinessSetting
    {
        return BusinessSetting::query()->create([
            'business_name' => 'Dapur Bersama',
            'whatsapp_number' => '081234567890',
            'max_orders_per_day' => 10,
            'is_open' => true,
        ]);
    }

    private function createCustomer(): Customer
    {
        return Customer::query()->create([
            'google_id' => 'google-'.fake()->unique()->uuid(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
        ]);
    }

    private function createActiveMenuItem(): MenuItem
    {
        $category = MenuCategory::query()->create([
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
        ]);

        return MenuItem::query()->create([
            'menu_category_id' => $category->id,
            'name' => 'Nasi Box Ayam',
            'slug' => 'nasi-box-ayam',
            'base_price' => 25000,
            'min_order' => 2,
            'is_active' => true,
        ]);
    }

    private function withCustomerJwt(Customer $customer): void
    {
        $this->withCookie(
            (string) config('customer-auth.cookie'),
            app(CustomerJwtService::class)->issue($customer),
        );
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function checkoutPayload(MenuItem $menuItem, array $overrides = []): array
    {
        return [
            'customer_name' => 'Budi Santoso',
            'phone' => '081200000001',
            'event_date' => now()->addDay()->toDateString(),
            'event_time' => '09:00',
            'event_name' => 'Rapat kantor',
            'address_name' => 'Kantor pusat',
            'event_address' => 'Jl. Mawar No. 1',
            'latitude' => -6.2,
            'longitude' => 106.816666,
            'notes' => 'Tanpa sambal',
            'recaptcha_token' => '',
            'items' => [
                [
                    'item_type' => 'menu_item',
                    'menu_item_id' => $menuItem->id,
                    'package_id' => null,
                    'qty' => 2,
                    'selected_items' => [],
                ],
            ],
            ...$overrides,
        ];
    }
}
