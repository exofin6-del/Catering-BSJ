<?php

namespace Tests\Feature\Customer;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\BusinessSetting;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_checkout_page_is_public_and_uses_business_whatsapp_number(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Dapur Bersama',
            'whatsapp_number' => '+62 812-3456-7890',
            'is_open' => true,
        ]);
        $this->createActiveMenuItem();

        $this->get(route('customerV2.checkout'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customersV2/checkout')
                ->where('business.name', 'Dapur Bersama')
                ->where('customerTheme', 'minimal')
                ->where('business.whatsapp_number', '6281234567890')
                ->has('businessSetting')
                ->has('menuItems', 1));
    }

    public function test_checkout_includes_catalog_props_from_the_storefront(): void
    {
        $this->createBusinessSetting();
        $this->createActiveMenuItem();
        $assetVersion = app(HandleInertiaRequests::class)->version(request());

        $response = $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) $assetVersion,
        ])
            ->get(route('customerV2.checkout'));

        $response
            ->assertOk()
            ->assertJsonPath('props.menuItems.0.name', 'Nasi Box Ayam')
            ->assertJsonPath('props.packages', []);
    }

    public function test_checkout_creates_pending_order_and_redirects_to_business_whatsapp(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();

        $response = $this->withHeader('X-Inertia', 'true')
            ->post(
                route('customerV2.storeCheckout'),
                $this->checkoutPayload($menuItem),
            );

        $response
            ->assertStatus(409)
            ->assertHeader('X-Inertia-Location');
        $this->assertStringStartsWith(
            'https://wa.me/6281234567890?text=',
            (string) $response->headers->get('X-Inertia-Location'),
        );

        $order = Order::query()
            ->with(['items', 'payments'])
            ->where('customer_name', 'Budi Santoso')
            ->sole();

        $this->assertSame('pending_confirmation', $order->status);
        $this->assertSame('full', $order->payment_type);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertNull($order->created_by_admin_id);
        $this->assertSame('50000.00', $order->total_price);
        $this->assertCount(1, $order->items);
        $this->assertCount(0, $order->payments);
    }

    public function test_checkout_ignores_submitted_payment_and_status_values(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();

        $this->withHeader('X-Inertia', 'true')
            ->post(route('customerV2.storeCheckout'), $this->checkoutPayload(
                $menuItem,
                [
                    'payment_amount' => 50000,
                    'payment_method' => 'cash',
                    'payment_paid_at' => now()->toDateTimeString(),
                    'payment_type' => 'dp',
                    'status' => 'confirmed',
                ],
            ))
            ->assertStatus(409);

        $order = Order::query()->with('payments')->sole();

        $this->assertSame('pending_confirmation', $order->status);
        $this->assertSame('full', $order->payment_type);
        $this->assertSame('unpaid', $order->payment_status);
        $this->assertCount(0, $order->payments);
    }

    public function test_checkout_requires_a_delivery_location(): void
    {
        $this->createBusinessSetting();
        $menuItem = $this->createActiveMenuItem();

        $this->from(route('customerV2.checkout'))
            ->post(route('customerV2.storeCheckout'), $this->checkoutPayload(
                $menuItem,
                [
                    'event_address' => null,
                    'latitude' => null,
                    'longitude' => null,
                ],
            ))
            ->assertRedirect(route('customerV2.checkout'))
            ->assertSessionHasErrors([
                'event_address',
                'latitude',
                'longitude',
            ]);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_does_not_create_order_when_whatsapp_is_not_configured(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Dapur Bersama',
            'is_open' => true,
        ]);
        $menuItem = $this->createActiveMenuItem();

        $this->from(route('customerV2.checkout'))
            ->post(
                route('customerV2.storeCheckout'),
                $this->checkoutPayload($menuItem),
            )
            ->assertRedirect(route('customerV2.checkout'))
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_does_not_create_order_when_business_is_closed(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Dapur Bersama',
            'whatsapp_number' => '081234567890',
            'is_open' => false,
        ]);
        $menuItem = $this->createActiveMenuItem();

        $this->from(route('customerV2.checkout'))
            ->post(
                route('customerV2.storeCheckout'),
                $this->checkoutPayload($menuItem),
            )
            ->assertRedirect(route('customerV2.checkout'))
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('orders', 0);
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
