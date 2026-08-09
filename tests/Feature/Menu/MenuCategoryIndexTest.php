<?php

namespace Tests\Feature\Menu;

use App\Models\MenuCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuCategoryIndexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }

    public function test_menu_category_index_redirects_to_generic_categories_page(): void
    {
        $user = User::factory()->create();

        $this
            ->actingAs($user)
            ->get(route('menu.kategori.index'))
            ->assertRedirect(route('categories.index', ['type' => 'menu']));
    }

    public function test_menu_category_edit_redirects_to_generic_category_edit_page(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Snack Box', 'snack-box', sortOrder: 1);

        $this
            ->actingAs($user)
            ->get(route('menu.kategori.edit', $category))
            ->assertRedirect(route('categories.edit', ['type' => 'menu', 'category' => $category->id]));
    }

    public function test_menu_category_status_can_be_updated(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Snack Box', 'snack-box');

        $this
            ->actingAs($user)
            ->patch(route('menu.kategori.status', $category), [
                'is_active' => false,
            ])
            ->assertRedirect(route('categories.index', ['type' => 'menu']));

        $this->assertFalse($category->refresh()->is_active);
    }

    private function createCategory(
        string $name,
        string $slug,
        bool $isActive = true,
        int $sortOrder = 1,
    ): MenuCategory {
        return MenuCategory::query()->create([
            'name' => $name,
            'slug' => $slug,
            'is_active' => $isActive,
            'sort_order' => $sortOrder,
        ]);
    }
}
