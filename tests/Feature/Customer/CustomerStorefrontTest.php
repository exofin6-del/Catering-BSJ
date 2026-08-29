<?php

namespace Tests\Feature\Customer;

use App\Models\BusinessSetting;
use App\Models\Customer;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Services\CustomerJwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CustomerStorefrontTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_storefront_is_public_and_only_contains_active_catalog_items(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Catering Bersama',
            'business_lat' => -7.5667,
            'business_lng' => 110.8167,
            'whatsapp_number' => '081234567890',
            'is_open' => true,
            'customer_theme' => 'terracotta',
        ]);
        $menuCategory = MenuCategory::query()->create([
            'icon' => 'utensils',
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
        ]);
        $packageCategory = PackageCategory::query()->create([
            'icon' => 'package',
            'name' => 'Paket Acara',
            'slug' => 'paket-acara',
        ]);

        MenuItem::query()->create([
            'menu_category_id' => $menuCategory->id,
            'name' => 'Nasi Ayam',
            'slug' => 'nasi-ayam',
            'base_price' => 25000,
            'is_active' => true,
        ]);
        MenuItem::query()->create([
            'name' => 'Menu Internal',
            'slug' => 'menu-internal',
            'base_price' => 10000,
            'is_active' => false,
        ]);
        Package::query()->create([
            'package_category_id' => $packageCategory->id,
            'name' => 'Paket Meeting',
            'slug' => 'paket-meeting',
            'price' => 50000,
            'is_active' => true,
        ]);
        Package::query()->create([
            'name' => 'Paket Internal',
            'slug' => 'paket-internal',
            'price' => 50000,
            'is_active' => false,
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customersV2/index')
                ->where('business.name', 'Catering Bersama')
                ->where('customerTheme', 'terracotta')
                ->where('business.is_open', true)
                ->where('business.latitude', '-7.5667000')
                ->where('business.longitude', '110.8167000')
                ->where('business.whatsapp_number', '6281234567890')
                ->has('menuItems', 1)
                ->where('menuItems.0.name', 'Nasi Ayam')
                ->where('menuItems.0.menu_category.icon', 'utensils')
                ->has('packages', 1)
                ->where('packages.0.name', 'Paket Meeting')
                ->where('packages.0.package_category.icon', 'package'));
    }

    public function test_package_detail_includes_catalog_data_for_the_customer_cart(): void
    {
        $menuCategory = MenuCategory::query()->create([
            'icon' => 'utensils',
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
        ]);
        $packageCategory = PackageCategory::query()->create([
            'icon' => 'package',
            'name' => 'Paket Acara',
            'slug' => 'paket-acara',
        ]);
        MenuItem::query()->create([
            'menu_category_id' => $menuCategory->id,
            'name' => 'Nasi Ayam',
            'slug' => 'nasi-ayam',
            'base_price' => 25000,
            'is_active' => true,
        ]);
        $package = Package::query()->create([
            'package_category_id' => $packageCategory->id,
            'name' => 'Paket Meeting',
            'slug' => 'paket-meeting',
            'price' => 50000,
            'is_active' => true,
        ]);

        $this->get(route('customerV2.packageDetail', $package))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customersV2/detail')
                ->where('item.name', 'Paket Meeting')
                ->has('menuItems', 1)
                ->has('packages', 1)
                ->where('packages.0.id', $package->id));
    }

    public function test_menu_detail_includes_catalog_data_for_recommendations_and_cart(): void
    {
        $menuCategory = MenuCategory::query()->create([
            'icon' => 'utensils',
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
        ]);
        $packageCategory = PackageCategory::query()->create([
            'icon' => 'package',
            'name' => 'Paket Acara',
            'slug' => 'paket-acara',
        ]);
        $menuItem = MenuItem::query()->create([
            'menu_category_id' => $menuCategory->id,
            'name' => 'Nasi Ayam',
            'slug' => 'nasi-ayam',
            'base_price' => 25000,
            'is_active' => true,
        ]);
        $package = Package::query()->create([
            'package_category_id' => $packageCategory->id,
            'name' => 'Paket Meeting',
            'slug' => 'paket-meeting',
            'price' => 50000,
            'is_active' => true,
        ]);

        $this->get(route('customerV2.menuDetail', $menuItem))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customersV2/detail')
                ->where('item.name', 'Nasi Ayam')
                ->has('menuItems', 1)
                ->where('menuItems.0.id', $menuItem->id)
                ->has('packages', 1)
                ->where('packages.0.id', $package->id));
    }

    public function test_storefront_exposes_the_authenticated_customer_as_auth_user(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Catering Bersama',
            'business_lat' => -7.5667,
            'business_lng' => 110.8167,
            'is_open' => true,
            'customer_theme' => 'terracotta',
        ]);
        $customer = Customer::query()->create([
            'google_id' => 'google-'.fake()->unique()->uuid(),
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'avatar' => 'https://example.com/budi.jpg',
            'email_verified_at' => now(),
        ]);
        $token = app(CustomerJwtService::class)->issue($customer);

        $this->withCookie((string) config('customer-auth.cookie'), $token)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', $customer->id)
                ->where('auth.user.email', 'budi@example.com')
                ->where('auth.user.name', 'Budi Santoso'));
    }

    public function test_customer_can_view_orders_page(): void
    {
        BusinessSetting::query()->create([
            'business_name' => 'Catering Bersama',
            'business_lat' => -7.5667,
            'business_lng' => 110.8167,
            'is_open' => true,
            'customer_theme' => 'terracotta',
        ]);
        $customer = Customer::query()->create([
            'google_id' => 'google-'.fake()->unique()->uuid(),
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'avatar' => 'https://example.com/budi.jpg',
            'email_verified_at' => now(),
        ]);
        $token = app(CustomerJwtService::class)->issue($customer);

        $this->withCookie((string) config('customer-auth.cookie'), $token)
            ->get(route('customerV2.orders'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('customersV2/orders')
                ->has('orders'));
    }
}
