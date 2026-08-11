<?php

namespace Tests\Feature\Menu;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Support\SessionKey;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MenuFormTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        cache()->forget('menu_categories');
    }

    public function test_create_page_displays_active_categories(): void
    {
        $user = User::factory()->create();

        $this->createCategory('Nasi Box', 'nasi-box', sortOrder: 2);
        $this->createCategory('Snack Box', 'snack-box', sortOrder: 1)->update(['icon' => 'cookie']);
        $this->createCategory('Hidden', 'hidden', isActive: false, sortOrder: 3);

        $this
            ->actingAs($user)
            ->get(route('menu.create'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/create')
                ->has('categories', 2)
                ->where('categories.0.name', 'Snack Box')
                ->where('categories.0.icon', 'cookie')
                ->where('categories.1.name', 'Nasi Box'));
    }

    public function test_edit_page_displays_menu_item_defaults(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Nasi Box', 'nasi-box');
        $category->update(['icon' => 'utensils']);
        $item = $this->createMenuItem($category, [
            'name' => 'Nasi Liwet',
            'slug' => 'nasi-liwet',
            'base_price' => 25000,
            'promo_price' => 22000,
            'description' => 'Paket nasi liwet komplit.',
            'min_order' => 5,
            'is_recommended' => true,
        ]);

        MenuImage::query()->create([
            'menu_item_id' => $item->id,
            'image_url' => '/storage/menu/items/1/nasi-liwet.jpg',
            'is_primary' => true,
            'sort_order' => 1,
        ]);

        $this
            ->actingAs($user)
            ->get(route('menu.edit', $item))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/menus/edit')
                ->where('item.name', 'Nasi Liwet')
                ->where('item.menu_category.name', 'Nasi Box')
                ->where('item.menu_category.icon', 'utensils')
                ->where('item.promo_price', '22000.00')
                ->where('item.images.0.image_url', '/storage/menu/items/1/nasi-liwet.jpg')
                ->has('categories', 1));
    }

    public function test_menu_can_be_created_with_image(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $category = $this->createCategory('Rice Bowl', 'rice-bowl');

        $response = $this
            ->actingAs($user)
            ->post(route('menu.store'), [
                'base_price' => 30000,
                'description' => 'Ayam suwir pedas dengan nasi.',
                'image' => UploadedFile::fake()->image('ayam-suwir.jpg', 600, 400),
                'is_active' => true,
                'is_recommended' => true,
                'menu_category_id' => $category->id,
                'min_order' => 2,
                'name' => 'Rice Bowl Ayam Suwir',
                'promo_price' => 25000,
            ]);

        $response
            ->assertRedirect(route('menu.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && ($flash['toast']['message'] ?? null) === 'Rice Bowl Ayam Suwir created.');

        $item = MenuItem::query()
            ->where('name', 'Rice Bowl Ayam Suwir')
            ->firstOrFail();

        $this->assertSame($category->id, $item->menu_category_id);
        $this->assertSame('rice-bowl-ayam-suwir', $item->slug);
        $this->assertSame('30000.00', $item->base_price);
        $this->assertSame('25000.00', $item->promo_price);
        $this->assertSame(2, $item->min_order);
        $this->assertTrue($item->is_recommended);
        $this->assertTrue($item->is_active);
        $this->assertSame($user->id, $item->created_by);

        $image = MenuImage::query()
            ->where('menu_item_id', $item->id)
            ->firstOrFail();

        $this->assertTrue($image->is_primary);
        Storage::disk('public')->assertExists(
            str_replace('/storage/', '', $image->image_url),
        );
    }

    public function test_menu_temporary_image_upload_accepts_images_larger_than_two_megabytes(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson(route('menu.images.temp.store'), [
                'image' => UploadedFile::fake()
                    ->image('large-menu.jpg', 2400, 1800)
                    ->size(4096),
            ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['id', 'name', 'url']);

        $path = str_replace('/storage/', '', (string) $response->json('url'));

        Storage::disk('public')->assertExists($path);
    }

    public function test_menu_creation_saves_the_icon_for_a_new_category(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('menu.store'), [
            'base_price' => 20000,
            'menu_category_name' => 'Menu Berkuah',
            'menu_category_icon' => 'soup',
            'min_order' => 1,
            'name' => 'Soto Ayam',
        ])->assertRedirect(route('menu.index'));

        $this->assertDatabaseHas('menu_categories', [
            'name' => 'Menu Berkuah',
            'icon' => 'soup',
        ]);
    }

    public function test_menu_creation_updates_the_selected_category_icon(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Rice Bowl', 'rice-bowl');

        $this->actingAs($user)->post(route('menu.store'), [
            'base_price' => 20000,
            'menu_category_id' => $category->id,
            'menu_category_icon' => 'soup',
            'min_order' => 1,
            'name' => 'Soto Ayam',
        ])->assertRedirect(route('menu.index'));

        $this->assertSame('soup', $category->refresh()->icon);
    }

    public function test_menu_create_rejects_more_than_five_temporary_images(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Rice Bowl', 'rice-bowl');

        $response = $this
            ->actingAs($user)
            ->from(route('menu.create'))
            ->post(route('menu.store'), [
                'base_price' => 30000,
                'description' => 'Ayam suwir pedas dengan nasi.',
                'menu_category_id' => $category->id,
                'min_order' => 2,
                'name' => 'Rice Bowl Ayam Suwir',
                'temporary_image_ids' => [
                    'temporary-image-1',
                    'temporary-image-2',
                    'temporary-image-3',
                    'temporary-image-4',
                    'temporary-image-5',
                    'temporary-image-6',
                ],
            ]);

        $response
            ->assertRedirect(route('menu.create'))
            ->assertSessionHasErrors([
                'temporary_image_ids' => 'Maksimal 5 gambar per menu.',
            ]);

        $this->assertDatabaseMissing('menu_items', [
            'name' => 'Rice Bowl Ayam Suwir',
        ]);
    }

    public function test_menu_can_be_updated(): void
    {
        $user = User::factory()->create();
        $oldCategory = $this->createCategory('Nasi Box', 'nasi-box');
        $newCategory = $this->createCategory('Snack Box', 'snack-box');
        $item = $this->createMenuItem($oldCategory, [
            'name' => 'Nasi Ayam',
            'slug' => 'nasi-ayam',
            'base_price' => 20000,
            'promo_price' => null,
            'is_active' => true,
            'is_recommended' => false,
        ]);

        $response = $this
            ->actingAs($user)
            ->put(route('menu.update', $item), [
                'base_price' => 28000,
                'description' => 'Snack gurih untuk rapat.',
                'is_active' => false,
                'is_recommended' => true,
                'menu_category_id' => $newCategory->id,
                'min_order' => 10,
                'name' => 'Snack Gurih',
                'promo_price' => null,
            ]);

        $response
            ->assertRedirect(route('menu.index'))
            ->assertSessionHas(SessionKey::FLASH_DATA, fn (array $flash): bool => ($flash['toast']['type'] ?? null) === 'success'
                && ($flash['toast']['message'] ?? null) === 'Snack Gurih updated.');

        $item->refresh();

        $this->assertSame($newCategory->id, $item->menu_category_id);
        $this->assertSame('Snack Gurih', $item->name);
        $this->assertSame('28000.00', $item->base_price);
        $this->assertNull($item->promo_price);
        $this->assertSame('Snack gurih untuk rapat.', $item->description);
        $this->assertSame(10, $item->min_order);
        $this->assertTrue($item->is_recommended);
        $this->assertFalse($item->is_active);
        $this->assertSame($user->id, $item->updated_by);
    }

    public function test_menu_update_rejects_more_than_five_images_after_existing_images(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Nasi Box', 'nasi-box');
        $item = $this->createMenuItem($category, [
            'name' => 'Nasi Ayam',
            'slug' => 'nasi-ayam',
        ]);

        for ($index = 1; $index <= 4; $index++) {
            MenuImage::query()->create([
                'menu_item_id' => $item->id,
                'image_url' => "/storage/menu/items/{$item->id}/nasi-ayam-{$index}.jpg",
                'is_primary' => $index === 1,
                'sort_order' => $index,
            ]);
        }

        $response = $this
            ->actingAs($user)
            ->from(route('menu.edit', $item))
            ->put(route('menu.update', $item), [
                'base_price' => 28000,
                'name' => 'Nasi Ayam',
                'temporary_image_ids' => [
                    'temporary-image-1',
                    'temporary-image-2',
                ],
            ]);

        $response
            ->assertRedirect(route('menu.edit', $item))
            ->assertSessionHasErrors([
                'temporary_image_ids' => 'Maksimal 5 gambar per menu. Hapus gambar lama dulu sebelum menambahkan gambar baru.',
            ]);

        $this->assertSame(4, $item->images()->count());
    }

    private function createCategory(
        string $name,
        string $slug,
        bool $isActive = true,
        int $sortOrder = 1,
    ): MenuCategory {
        return MenuCategory::query()->create([
            'is_active' => $isActive,
            'name' => $name,
            'slug' => $slug,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createMenuItem(MenuCategory $category, array $overrides = []): MenuItem
    {
        return MenuItem::query()->create([
            'base_price' => $overrides['base_price'] ?? 25000,
            'description' => $overrides['description'] ?? null,
            'is_active' => $overrides['is_active'] ?? true,
            'is_recommended' => $overrides['is_recommended'] ?? false,
            'menu_category_id' => $category->id,
            'min_order' => $overrides['min_order'] ?? 1,
            'name' => $overrides['name'] ?? 'Nasi Box',
            'promo_price' => $overrides['promo_price'] ?? null,
            'slug' => $overrides['slug'] ?? 'nasi-box',
            'sort_order' => $overrides['sort_order'] ?? 1,
        ]);
    }
}
