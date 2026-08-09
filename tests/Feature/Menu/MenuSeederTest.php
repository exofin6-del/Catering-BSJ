<?php

namespace Tests\Feature\Menu;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use Database\Seeders\MenuSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_menu_seeder_creates_one_hundred_menu_items(): void
    {
        $this->seed(MenuSeeder::class);

        $this->assertSame(4, MenuCategory::query()->count());
        $this->assertSame(100, MenuItem::query()->count());
        $this->assertSame(100, MenuImage::query()->where('is_primary', true)->count());
        $this->assertDatabaseHas('menu_items', [
            'slug' => 'nasi-box-ayam-bakar',
            'is_recommended' => true,
        ]);
    }
}
