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

    public function test_legacy_menu_category_endpoints_are_removed(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Snack Box', 'snack-box');

        $this
            ->actingAs($user)
            ->get('/menu/kategori')
            ->assertNotFound();

        $this
            ->actingAs($user)
            ->get("/menu/kategori/{$category->id}/edit")
            ->assertNotFound();
    }

    public function test_menu_category_status_can_be_updated(): void
    {
        $user = User::factory()->create();
        $category = $this->createCategory('Snack Box', 'snack-box');

        $this
            ->actingAs($user)
            ->patch(route('categories.status', ['type' => 'menu', 'category' => $category]), [
                'is_active' => false,
            ])
            ->assertRedirect(route('categories.index'));

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
