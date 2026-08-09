<?php

namespace Tests\Feature\Category;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\PackageItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CategoryIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_category_index_displays_menu_and_package_categories(): void
    {
        $user = User::factory()->create();
        $menuCategory = $this->createMenuCategory('Snack Box', 'snack-box');
        $packageCategory = $this->createPackageCategory('Paket Meeting', 'paket-meeting');

        $this->createMenuItem($menuCategory, 'Risoles', 'risoles');
        $this->createPackageItem($menuCategory);
        $this->createPackage($packageCategory);

        $this
            ->actingAs($user)
            ->get(route('categories.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/kategori/index')
                ->where('filters.category_id', null)
                ->where('filters.type', 'all')
                ->where('filters.search', '')
                ->has('category_options', 0)
                ->has('items.data', 2)
                ->where('items.data.0.key', "menu:{$menuCategory->id}")
                ->where('items.data.0.type', 'menu')
                ->where('items.data.0.name', 'Snack Box')
                ->where('items.data.0.menu_items_count', 1)
                ->where('items.data.0.package_items_count', 1)
                ->where('items.data.1.key', "paket:{$packageCategory->id}")
                ->where('items.data.1.type', 'paket')
                ->where('items.data.1.name', 'Paket Meeting')
                ->where('items.data.1.packages_count', 1));
    }

    public function test_category_index_filters_by_type_and_search(): void
    {
        $user = User::factory()->create();

        $this->createMenuCategory('Snack Box', 'snack-box');
        $this->createPackageCategory('Paket Meeting', 'paket-meeting');
        $this->createPackageCategory('Paket Wedding', 'paket-wedding');

        $this
            ->actingAs($user)
            ->get(route('categories.index', [
                'search' => 'wedding',
                'type' => 'paket',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/kategori/index')
                ->where('filters.category_id', null)
                ->where('filters.type', 'paket')
                ->where('filters.search', 'wedding')
                ->has('category_options', 2)
                ->has('items.data', 1)
                ->where('items.data.0.type', 'paket')
                ->where('items.data.0.name', 'Paket Wedding'));
    }

    public function test_category_index_filters_by_selected_category(): void
    {
        $user = User::factory()->create();

        $this->createMenuCategory('Snack Box', 'snack-box');
        $category = $this->createMenuCategory('Nasi Box', 'nasi-box');
        $this->createPackageCategory('Paket Meeting', 'paket-meeting');

        $this
            ->actingAs($user)
            ->get(route('categories.index', [
                'category_id' => $category->id,
                'type' => 'menu',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/kategori/index')
                ->where('filters.category_id', $category->id)
                ->where('filters.type', 'menu')
                ->has('category_options', 2)
                ->has('items.data', 1)
                ->where('items.data.0.key', "menu:{$category->id}")
                ->where('items.data.0.name', 'Nasi Box'));
    }

    public function test_category_can_be_created_for_selected_type(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user)
            ->post(route('categories.store'), [
                'type' => 'paket',
                'name' => 'Paket Corporate',
                'icon' => 'briefcase',
                'is_active' => true,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertDatabaseHas('package_categories', [
            'name' => 'Paket Corporate',
            'slug' => 'paket-corporate',
            'icon' => 'briefcase',
            'is_active' => true,
        ]);
    }

    public function test_category_can_be_updated_and_status_changed(): void
    {
        $user = User::factory()->create();
        $category = $this->createMenuCategory('Snack Box', 'snack-box');

        $this
            ->actingAs($user)
            ->put(route('categories.update', ['type' => 'menu', 'category' => $category->id]), [
                'name' => 'Snack Premium',
                'icon' => null,
                'is_active' => true,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertDatabaseHas('menu_categories', [
            'id' => $category->id,
            'name' => 'Snack Premium',
            'slug' => 'snack-premium',
        ]);

        $this
            ->actingAs($user)
            ->patch(route('categories.status', ['type' => 'menu', 'category' => $category->id]), [
                'is_active' => false,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertFalse($category->refresh()->is_active);
    }

    public function test_category_can_be_reordered(): void
    {
        $user = User::factory()->create();
        $category1 = $this->createMenuCategory('Snack Box', 'snack-box');
        $category2 = $this->createMenuCategory('Nasi Box', 'nasi-box');

        $category2->update(['sort_order' => 2]);

        $this
            ->actingAs($user)
            ->post(route('categories.reorder'), [
                'type' => 'menu',
                'moved_id' => $category1->id,
                'target_sort_order' => 2,
            ])
            ->assertRedirect(route('categories.index'));

        $this->assertEquals(2, $category1->refresh()->sort_order);
        $this->assertEquals(1, $category2->refresh()->sort_order);
    }

    private function createMenuCategory(string $name, string $slug): MenuCategory
    {
        return MenuCategory::query()->create([
            'name' => $name,
            'slug' => $slug,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    private function createPackageCategory(string $name, string $slug): PackageCategory
    {
        return PackageCategory::query()->create([
            'name' => $name,
            'slug' => $slug,
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    private function createMenuItem(MenuCategory $category, string $name, string $slug): MenuItem
    {
        return MenuItem::query()->create([
            'menu_category_id' => $category->id,
            'name' => $name,
            'slug' => $slug,
            'base_price' => 10000,
        ]);
    }

    private function createPackage(PackageCategory $category): Package
    {
        return Package::query()->create([
            'package_category_id' => $category->id,
            'name' => 'Paket Meeting A',
            'slug' => 'paket-meeting-a',
            'price' => 50000,
        ]);
    }

    private function createPackageItem(MenuCategory $category): PackageItem
    {
        $package = Package::query()->create([
            'name' => 'Paket Snack',
            'slug' => 'paket-snack',
            'price' => 25000,
        ]);

        return PackageItem::query()->create([
            'package_id' => $package->id,
            'name' => 'Pilihan Snack',
            'menu_category_id' => $category->id,
        ]);
    }
}
