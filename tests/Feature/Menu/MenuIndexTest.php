<?php

namespace Tests\Feature\Menu;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MenuIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_menu_index_includes_active_categories_for_filter_chips(): void
    {
        $user = User::factory()->create();

        MenuCategory::query()->create([
            'name' => 'Nasi Box',
            'slug' => 'nasi-box',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        MenuCategory::query()->create([
            'name' => 'Snack Box',
            'slug' => 'snack-box',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        MenuCategory::query()->create([
            'name' => 'Hidden',
            'slug' => 'hidden',
            'is_active' => false,
            'sort_order' => 3,
        ]);

        $this
            ->actingAs($user)
            ->get(route('menu.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/index')
                ->has('categories', 2)
                ->where('categories.0.name', 'Snack Box')
                ->where('categories.1.name', 'Nasi Box'));
    }

    public function test_menu_index_includes_top_ordered_items_for_chart(): void
    {
        $user = User::factory()->create();
        $firstOrder = $this->createOrder('ORD-001');
        $secondOrder = $this->createOrder('ORD-002');
        $thirdOrder = $this->createOrder('ORD-003');
        $fourthOrder = $this->createOrder('ORD-004');

        $first = $this->createMenuItem('Nasi Liwet', 'nasi-liwet');
        $second = $this->createMenuItem('Ayam Bakar', 'ayam-bakar');
        $third = $this->createMenuItem('Sate Ayam', 'sate-ayam');
        $fourth = $this->createMenuItem('Snack Box', 'snack-box-menu');
        $fifth = $this->createMenuItem('Es Teh', 'es-teh');

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
            ->get(route('menu.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/index')
                ->has('topOrderedItems', 4)
                ->where('topOrderedItems.0.name', 'Ayam Bakar')
                ->where('topOrderedItems.0.ordered_count', 3)
                ->where('topOrderedItems.1.name', 'Sate Ayam')
                ->where('topOrderedItems.1.ordered_count', 2)
                ->where('topOrderedItems.2.name', 'Snack Box')
                ->where('topOrderedItems.2.ordered_count', 2)
                ->where('topOrderedItems.3.name', 'Es Teh')
                ->where('topOrderedItems.3.ordered_count', 1));
    }

    public function test_menu_index_top_ordered_items_follow_category_filter(): void
    {
        $user = User::factory()->create();
        $nasiBox = $this->createCategory('Nasi Box', 'nasi-box');
        $snackBox = $this->createCategory('Snack Box', 'snack-box');
        $firstOrder = $this->createOrder('ORD-001');
        $secondOrder = $this->createOrder('ORD-002');
        $thirdOrder = $this->createOrder('ORD-003');

        $nasiAyam = $this->createMenuItem('Nasi Ayam', 'nasi-ayam', $nasiBox);
        $nasiRendang = $this->createMenuItem('Nasi Rendang', 'nasi-rendang', $nasiBox);
        $snackPremium = $this->createMenuItem('Snack Premium', 'snack-premium', $snackBox);

        $this->createOrderItem($firstOrder, $nasiAyam, 1);
        $this->createOrderItem($secondOrder, $nasiAyam, 1);
        $this->createOrderItem($thirdOrder, $nasiRendang, 1);
        $this->createOrderItem($firstOrder, $snackPremium, 1);
        $this->createOrderItem($secondOrder, $snackPremium, 1);
        $this->createOrderItem($thirdOrder, $snackPremium, 1);

        $this
            ->actingAs($user)
            ->get(route('menu.index', ['category_id' => $nasiBox->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/index')
                ->where('filters.category_id', $nasiBox->id)
                ->has('topOrderedItems', 2)
                ->where('topOrderedItems.0.name', 'Nasi Ayam')
                ->where('topOrderedItems.0.ordered_count', 2)
                ->where('topOrderedItems.1.name', 'Nasi Rendang')
                ->where('topOrderedItems.1.ordered_count', 1));
    }

    public function test_menu_index_partial_reload_can_request_only_table_props(): void
    {
        $user = User::factory()->create();

        $this->createMenuItem('Nasi Liwet', 'nasi-liwet');

        $response = $this
            ->actingAs($user)
            ->get(route('menu.index', ['per_page' => 25]));

        $response
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/index')
                ->has('items.data', 1)
                ->where('filters.per_page', 25)
                ->reloadOnly(['items', 'filters'], fn (Assert $reload) => $reload
                    ->has('items')
                    ->has('filters')
                    ->missing('categories')
                    ->missing('activityItems')
                    ->missing('stats')
                    ->missing('topOrderedItems')));
    }

    private function createOrder(string $code): Order
    {
        return Order::query()->create([
            'order_code' => $code,
            'customer_name' => 'Rina',
            'phone' => '081234567890',
            'event_date' => now()->toDateString(),
            'event_name' => 'Meeting',
        ]);
    }

    private function createCategory(string $name, string $slug): MenuCategory
    {
        return MenuCategory::query()->create([
            'name' => $name,
            'slug' => $slug,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    private function createMenuItem(string $name, string $slug, ?MenuCategory $category = null): MenuItem
    {
        return MenuItem::query()->create([
            'menu_category_id' => $category?->id,
            'name' => $name,
            'slug' => $slug,
            'base_price' => 10000,
        ]);
    }

    private function createOrderItem(Order $order, MenuItem $item, int $quantity): OrderItem
    {
        return OrderItem::query()->create([
            'order_id' => $order->id,
            'menu_item_id' => $item->id,
            'item_type' => 'menu_item',
            'name_snapshot' => $item->name,
            'price_snapshot' => $item->base_price,
            'qty' => $quantity,
            'subtotal' => (int) $item->base_price * $quantity,
        ]);
    }
}
