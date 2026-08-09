<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataTableExportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_menu_export_returns_all_rows_matching_category_and_status_filters(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory('Snack Box', 'snack-box');
        $otherCategory = $this->createMenuCategory('Nasi Box', 'nasi-box');

        for ($i = 1; $i <= 12; $i++) {
            $this->createMenuItem($category, "Snack {$i}", "snack-{$i}", [
                'sort_order' => $i,
            ]);
        }

        $this->createMenuItem($category, 'Snack Nonaktif', 'snack-nonaktif', [
            'is_active' => false,
            'sort_order' => 13,
        ]);
        $this->createMenuItem($otherCategory, 'Nasi Liwet', 'nasi-liwet');

        $response = $this
            ->actingAs($user)
            ->getJson(route('menu.export', [
                'category_id' => $category->id,
                'per_page' => 10,
                'status' => 'active',
            ]));

        $response->assertOk();

        $rows = collect($response->json('data'));

        $this->assertSame(12, $response->json('total'));
        $this->assertCount(12, $rows);
        $this->assertFalse($rows->pluck('name')->contains('Snack Nonaktif'));
        $this->assertFalse($rows->pluck('name')->contains('Nasi Liwet'));
    }

    public function test_package_export_returns_all_rows_matching_category_and_status_filters(): void
    {
        $user = User::factory()->create();
        $category = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $otherCategory = $this->createPackageCategory('Paket Wedding', 'paket-wedding');

        for ($i = 1; $i <= 11; $i++) {
            $this->createPackage($category, [
                'name' => "Paket Meeting {$i}",
                'slug' => "paket-meeting-{$i}",
                'sort_order' => $i,
            ]);
        }

        $this->createPackage($category, [
            'is_active' => false,
            'name' => 'Paket Nonaktif',
            'slug' => 'paket-nonaktif',
            'sort_order' => 12,
        ]);
        $this->createPackage($otherCategory, [
            'name' => 'Paket Wedding A',
            'slug' => 'paket-wedding-a',
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson(route('paket.export', [
                'category_id' => $category->id,
                'per_page' => 10,
                'status' => 'active',
            ]));

        $response->assertOk();

        $rows = collect($response->json('data'));

        $this->assertSame(11, $response->json('total'));
        $this->assertCount(11, $rows);
        $this->assertFalse($rows->pluck('name')->contains('Paket Nonaktif'));
        $this->assertFalse($rows->pluck('name')->contains('Paket Wedding A'));
    }

    public function test_order_export_returns_all_rows_matching_status_filters(): void
    {
        $user = User::factory()->create();

        for ($i = 1; $i <= 12; $i++) {
            $this->createOrder([
                'order_code' => sprintf('ORD-%03d', $i),
                'payment_status' => 'dp_paid',
                'status' => 'confirmed',
            ]);
        }

        $this->createOrder([
            'order_code' => 'ORD-998',
            'payment_status' => 'unpaid',
            'status' => 'confirmed',
        ]);
        $this->createOrder([
            'order_code' => 'ORD-999',
            'payment_status' => 'dp_paid',
            'status' => 'canceled',
        ]);

        $response = $this
            ->actingAs($user)
            ->getJson(route('order.export', [
                'payment_status' => 'dp_paid',
                'per_page' => 10,
                'status' => 'confirmed',
            ]));

        $response->assertOk();

        $rows = collect($response->json('data'));

        $this->assertSame(12, $response->json('total'));
        $this->assertCount(12, $rows);
        $this->assertTrue($rows->every(fn (array $row): bool => $row['status'] === 'confirmed'));
        $this->assertTrue($rows->every(fn (array $row): bool => $row['payment_status'] === 'dp_paid'));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createMenuItem(MenuCategory $category, string $name, string $slug, array $overrides = []): MenuItem
    {
        return MenuItem::query()->create([
            'base_price' => $overrides['base_price'] ?? 10000,
            'is_active' => $overrides['is_active'] ?? true,
            'menu_category_id' => $category->id,
            'min_order' => $overrides['min_order'] ?? 1,
            'name' => $name,
            'slug' => $slug,
            'sort_order' => $overrides['sort_order'] ?? 1,
        ]);
    }

    private function createMenuCategory(string $name, string $slug): MenuCategory
    {
        return MenuCategory::query()->create([
            'is_active' => true,
            'name' => $name,
            'slug' => $slug,
            'sort_order' => 1,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPackage(PackageCategory $category, array $overrides = []): Package
    {
        return Package::query()->create([
            'is_active' => $overrides['is_active'] ?? true,
            'is_recommended' => $overrides['is_recommended'] ?? false,
            'min_order' => $overrides['min_order'] ?? 1,
            'name' => $overrides['name'] ?? 'Paket Meeting',
            'package_category_id' => $category->id,
            'price' => $overrides['price'] ?? 50000,
            'slug' => $overrides['slug'] ?? 'paket-meeting',
            'sort_order' => $overrides['sort_order'] ?? 1,
        ]);
    }

    private function createPackageCategory(string $name, string $slug): PackageCategory
    {
        return PackageCategory::query()->create([
            'is_active' => true,
            'name' => $name,
            'slug' => $slug,
            'sort_order' => 1,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createOrder(array $overrides = []): Order
    {
        return Order::query()->create([
            'customer_name' => $overrides['customer_name'] ?? 'Budi Santoso',
            'event_address' => $overrides['event_address'] ?? 'Jl. Mawar No. 1',
            'event_date' => $overrides['event_date'] ?? now()->addDay()->toDateString(),
            'event_name' => $overrides['event_name'] ?? 'Rapat kantor',
            'event_time' => $overrides['event_time'] ?? '09:00',
            'order_code' => $overrides['order_code'] ?? 'ORD-'.fake()->unique()->numberBetween(1000, 9999),
            'payment_status' => $overrides['payment_status'] ?? 'unpaid',
            'payment_type' => $overrides['payment_type'] ?? 'full',
            'phone' => $overrides['phone'] ?? '081234567890',
            'status' => $overrides['status'] ?? 'pending_confirmation',
            'subtotal' => $overrides['subtotal'] ?? 100000,
            'total_price' => $overrides['total_price'] ?? 100000,
        ]);
    }
}
