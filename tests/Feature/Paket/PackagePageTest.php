<?php

namespace Tests\Feature\Paket;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\PackageImage;
use App\Models\PackageItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Support\SessionKey;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PackagePageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_package_index_includes_filters_stats_categories_items_and_activity(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Nasi Box', 'nasi-box');
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $this->createPackageCategory('Hidden', 'hidden', isActive: false, sortOrder: 2);
        $menuItem = $this->createMenuItem($menuCategory, 'Nasi Liwet', 'nasi-liwet', basePrice: 25000);
        $inactiveItem = $this->createMenuItem($menuCategory, 'Ayam Bakar', 'ayam-bakar', basePrice: 30000);

        $matchingPackage = $this->createPackage($packageCategory, [
            'description' => 'Paket meeting kantor.',
            'is_active' => true,
            'is_recommended' => true,
            'name' => 'Paket Meeting A',
            'price' => 22000,
            'slug' => 'paket-meeting-a',
            'sort_order' => 1,
        ]);
        $this->createPackageItem($matchingPackage, $menuItem, [
            'package_price' => 22000,
        ]);

        $otherPackage = $this->createPackage($packageCategory, [
            'is_active' => false,
            'name' => 'Paket Internal',
            'slug' => 'paket-internal',
            'sort_order' => 2,
        ]);
        $this->createPackageItem($otherPackage, $inactiveItem);

        $this
            ->actingAs($user)
            ->get(route('paket.index', [
                'category_id' => $packageCategory->id,
                'promo' => 'yes',
                'recommended' => 'yes',
                'search' => 'meeting',
                'status' => 'active',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/packages/index')
                ->where('filters.category_id', $packageCategory->id)
                ->where('filters.promo', 'yes')
                ->where('filters.recommended', 'yes')
                ->where('filters.search', 'meeting')
                ->where('filters.status', 'active')
                ->has('items.data', 1)
                ->where('items.data.0.name', 'Paket Meeting A')
                ->where('items.data.0.items.0.menu_item.name', 'Nasi Liwet')
                ->has('packageCategories', 1)
                ->where('packageCategories.0.name', 'Paket Meeting')
                ->where('stats.total', 2)
                ->where('stats.active', 1)
                ->where('stats.recommended', 1)
                ->where('stats.promo', 1)
                ->has('activityItems', 2));
    }

    public function test_package_create_page_includes_active_categories_and_menu_items(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');

        $this->createPackageCategory('Paket Meeting', 'paket-meeting')->update(['icon' => 'package']);
        $this->createPackageCategory('Hidden', 'hidden', isActive: false);
        $this->createMenuItem($menuCategory, 'Risoles', 'risoles');
        $this->createMenuItem($menuCategory, 'Hidden Menu', 'hidden-menu', isActive: false);

        $this
            ->actingAs($user)
            ->get(route('paket.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/packages/create')
                ->has('packageCategories', 1)
                ->where('packageCategories.0.name', 'Paket Meeting')
                ->where('packageCategories.0.icon', 'package')
                ->has('menuItems', 1)
                ->where('menuItems.0.name', 'Risoles'));
    }

    public function test_package_index_includes_top_ordered_packages_for_chart(): void
    {
        $user = User::factory()->create();
        $category = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $firstOrder = $this->createOrder('ORD-PKG-001');
        $secondOrder = $this->createOrder('ORD-PKG-002');
        $thirdOrder = $this->createOrder('ORD-PKG-003');
        $fourthOrder = $this->createOrder('ORD-PKG-004');

        $first = $this->createPackage($category, [
            'name' => 'Paket A',
            'slug' => 'paket-a',
        ]);
        $second = $this->createPackage($category, [
            'name' => 'Paket B',
            'slug' => 'paket-b',
        ]);
        $third = $this->createPackage($category, [
            'name' => 'Paket C',
            'slug' => 'paket-c',
        ]);
        $fourth = $this->createPackage($category, [
            'name' => 'Paket D',
            'slug' => 'paket-d',
        ]);
        $fifth = $this->createPackage($category, [
            'name' => 'Paket E',
            'slug' => 'paket-e',
        ]);

        $this->createOrderItem($firstOrder, $first, 12);
        $this->createOrderItem($firstOrder, $second, 1);
        $this->createOrderItem($secondOrder, $second, 5);
        $this->createOrderItem($thirdOrder, $second, 2);
        $this->createOrderItem($firstOrder, $third, 6);
        $this->createOrderItem($secondOrder, $third, 1);
        $this->createOrderItem($secondOrder, $fourth, 4);
        $this->createOrderItem($thirdOrder, $fourth, 3);
        $this->createOrderItem($fourthOrder, $fifth, 30);

        $this
            ->actingAs($user)
            ->get(route('paket.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/packages/index')
                ->has('topOrderedPackages', 4)
                ->where('topOrderedPackages.0.name', 'Paket B')
                ->where('topOrderedPackages.0.ordered_count', 3)
                ->where('topOrderedPackages.1.name', 'Paket C')
                ->where('topOrderedPackages.1.ordered_count', 2)
                ->where('topOrderedPackages.2.name', 'Paket D')
                ->where('topOrderedPackages.2.ordered_count', 2)
                ->where('topOrderedPackages.3.name', 'Paket A')
                ->where('topOrderedPackages.3.ordered_count', 1));
    }

    public function test_package_store_uses_lowest_choice_price_for_package_price(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $premiumSnack = $this->createMenuItem($menuCategory, 'Premium Snack', 'premium-snack', basePrice: 30000);
        $promoSnack = $this->createMenuItem($menuCategory, 'Promo Snack', 'promo-snack', basePrice: 25000);

        $this
            ->actingAs($user)
            ->post(route('paket.store'), [
                'name' => 'Paket Pilihan Harga',
                'package_category_id' => $packageCategory->id,
                'min_order' => 1,
                'package_components' => [
                    [
                        'name' => 'Pilih snack',
                        'menu_item_id' => $premiumSnack->id,
                        'min_select' => 1,
                        'max_select' => 1,
                        'item_prices' => [
                            [
                                'menu_item_id' => $premiumSnack->id,
                                'package_price' => 30000,
                                'is_recommended' => false,
                            ],
                            [
                                'menu_item_id' => $promoSnack->id,
                                'package_price' => 20000,
                                'is_recommended' => false,
                            ],
                        ],
                    ],
                ],
            ])
            ->assertRedirect(route('paket.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && ($flash['toast']['message'] ?? null) === 'Package created.');

        $package = Package::query()
            ->where('name', 'Paket Pilihan Harga')
            ->first();

        $this->assertNotNull($package);
        $this->assertSame('20000.00', $package->price);
    }

    public function test_package_can_be_updated_and_flashes_success_toast(): void
    {
        $user = User::factory()->create();
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $package = $this->createPackage($packageCategory, [
            'name' => 'Paket Lama',
            'slug' => 'paket-lama',
        ]);

        $this
            ->actingAs($user)
            ->put(route('paket.update', $package), [
                'name' => 'Paket Baru',
            ])
            ->assertRedirect(route('paket.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && ($flash['toast']['message'] ?? null) === 'Package updated.');

        $this->assertSame('Paket Baru', $package->refresh()->name);
    }

    public function test_package_temporary_image_upload_accepts_images_larger_than_two_megabytes(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson(route('paket.images.temp.store'), [
                'image' => UploadedFile::fake()
                    ->image('large-package.jpg', 2400, 1800)
                    ->size(4096),
            ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['id', 'name', 'url']);

        $path = str_replace('/storage/', '', (string) $response->json('url'));

        Storage::disk('public')->assertExists($path);
    }

    public function test_package_creation_saves_the_icon_for_a_new_category(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');
        $menuItem = $this->createMenuItem($menuCategory, 'Risoles', 'risoles');

        $this->actingAs($user)->post(route('paket.store'), [
            'name' => 'Paket Baru',
            'package_category_name' => 'Paket Spesial',
            'package_category_icon' => 'cake-slice',
            'min_order' => 1,
            'package_components' => [[
                'menu_item_id' => $menuItem->id,
                'package_price' => 12000,
            ]],
        ])->assertRedirect(route('paket.index'));

        $this->assertDatabaseHas('package_categories', [
            'name' => 'Paket Spesial',
            'icon' => 'cake-slice',
        ]);
    }

    public function test_package_creation_updates_the_selected_category_icon(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $menuItem = $this->createMenuItem($menuCategory, 'Risoles', 'risoles');

        $this->actingAs($user)->post(route('paket.store'), [
            'name' => 'Paket Baru',
            'package_category_id' => $packageCategory->id,
            'package_category_icon' => 'cake-slice',
            'min_order' => 1,
            'package_components' => [[
                'menu_item_id' => $menuItem->id,
                'package_price' => 12000,
            ]],
        ])->assertRedirect(route('paket.index'));

        $this->assertSame('cake-slice', $packageCategory->refresh()->icon);
    }

    public function test_package_edit_page_displays_package_defaults(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Nasi Box', 'nasi-box');
        $packageCategory = $this->createPackageCategory('Paket Keluarga', 'paket-keluarga');
        $menuItem = $this->createMenuItem($menuCategory, 'Nasi Liwet', 'nasi-liwet', basePrice: 25000);
        $package = $this->createPackage($packageCategory, [
            'description' => 'Paket keluarga lengkap.',
            'is_recommended' => true,
            'min_order' => 5,
            'name' => 'Paket Keluarga A',
            'price' => 23000,
            'slug' => 'paket-keluarga-a',
        ]);

        $this->createPackageItem($package, $menuItem, [
            'package_price' => 23000,
        ]);
        PackageImage::query()->create([
            'image_url' => '/storage/paket/items/1/paket-keluarga.jpg',
            'is_primary' => true,
            'package_id' => $package->id,
            'sort_order' => 1,
        ]);

        $this
            ->actingAs($user)
            ->get(route('paket.edit', $package))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/packages/edit')
                ->where('package.name', 'Paket Keluarga A')
                ->where('package.package_category.name', 'Paket Keluarga')
                ->where('package.items.0.menu_item.name', 'Nasi Liwet')
                ->where('package.images.0.image_url', '/storage/paket/items/1/paket-keluarga.jpg')
                ->has('menuItems', 1)
                ->has('packageCategories', 1));
    }

    public function test_package_show_page_displays_package_detail(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $menuItem = $this->createMenuItem($menuCategory, 'Risoles', 'risoles', basePrice: 12000);
        $package = $this->createPackage($packageCategory, [
            'name' => 'Paket Meeting Snack',
            'price' => 10000,
            'slug' => 'paket-meeting-snack',
        ]);

        $this->createPackageItem($package, $menuItem, [
            'package_price' => 10000,
        ]);

        $this
            ->actingAs($user)
            ->get(route('paket.show', $package))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/packages/show')
                ->where('package.name', 'Paket Meeting Snack')
                ->where('package.package_category.name', 'Paket Meeting')
                ->where('package.items_count', 1)
                ->where('package.items.0.menu_item.name', 'Risoles'));
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

    private function createPackageCategory(
        string $name,
        string $slug,
        bool $isActive = true,
        int $sortOrder = 1,
    ): PackageCategory {
        return PackageCategory::query()->create([
            'is_active' => $isActive,
            'name' => $name,
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);
    }

    private function createMenuItem(
        MenuCategory $category,
        string $name,
        string $slug,
        int $basePrice = 15000,
        bool $isActive = true,
    ): MenuItem {
        return MenuItem::query()->create([
            'base_price' => $basePrice,
            'is_active' => $isActive,
            'menu_category_id' => $category->id,
            'min_order' => 1,
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
            'description' => $overrides['description'] ?? null,
            'is_active' => $overrides['is_active'] ?? true,
            'is_recommended' => $overrides['is_recommended'] ?? false,
            'min_order' => $overrides['min_order'] ?? 1,
            'name' => $overrides['name'] ?? 'Paket Meeting',
            'package_category_id' => $category->id,
            'price' => $overrides['price'] ?? 15000,
            'slug' => $overrides['slug'] ?? 'paket-meeting',
            'sort_order' => $overrides['sort_order'] ?? 1,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPackageItem(
        Package $package,
        MenuItem $menuItem,
        array $overrides = [],
    ): PackageItem {
        return PackageItem::query()->create([
            'is_recommended' => $overrides['is_recommended'] ?? false,
            'menu_item_id' => $menuItem->id,
            'name' => $overrides['name'] ?? $menuItem->name,
            'package_id' => $package->id,
            'package_price' => $overrides['package_price'] ?? $menuItem->base_price,
            'sort_order' => $overrides['sort_order'] ?? 1,
        ]);
    }

    private function createOrder(string $code): Order
    {
        return Order::query()->create([
            'customer_name' => 'Rina',
            'event_date' => now()->toDateString(),
            'event_name' => 'Meeting',
            'order_code' => $code,
            'phone' => '081234567890',
        ]);
    }

    private function createOrderItem(Order $order, Package $package, int $quantity): OrderItem
    {
        return OrderItem::query()->create([
            'item_type' => 'package',
            'name_snapshot' => $package->name,
            'order_id' => $order->id,
            'package_id' => $package->id,
            'price_snapshot' => $package->price,
            'qty' => $quantity,
            'subtotal' => (int) $package->price * $quantity,
        ]);
    }
}
