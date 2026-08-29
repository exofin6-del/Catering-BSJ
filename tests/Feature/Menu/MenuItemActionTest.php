<?php

namespace Tests\Feature\Menu;

use App\Actions\Admin\Menu\MenuItemIndex;
use App\Actions\Admin\Menu\MenuItemReorder;
use App\Actions\Admin\Menu\MenuItemStats;
use App\Models\MenuImage;
use App\Models\MenuItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MenuItemActionTest extends TestCase
{
    use RefreshDatabase;

    public function test_recent_activities_uses_lightweight_payload_with_primary_image(): void
    {
        $olderItem = $this->createMenuItem('Nasi Liwet', 'nasi-liwet', 1);
        $latestItem = $this->createMenuItem('Ayam Bakar', 'ayam-bakar', 2);

        $olderItem->forceFill([
            'created_at' => now()->subDays(2),
            'updated_at' => now()->subDays(2),
        ])->save();
        $latestItem->forceFill([
            'created_at' => now()->subDay(),
            'updated_at' => now(),
        ])->save();

        MenuImage::query()->create([
            'menu_item_id' => $latestItem->id,
            'image_url' => '/storage/menu/items/primary.jpg',
            'is_primary' => true,
            'sort_order' => 1,
        ]);
        MenuImage::query()->create([
            'menu_item_id' => $latestItem->id,
            'image_url' => '/storage/menu/items/secondary.jpg',
            'is_primary' => false,
            'sort_order' => 2,
        ]);

        DB::enableQueryLog();
        DB::flushQueryLog();

        $activities = app(MenuItemStats::class)->recentActivities();
        $queries = DB::getQueryLog();

        DB::disableQueryLog();

        $this->assertCount(1, $queries);
        $this->assertSame($latestItem->id, $activities[0]['id']);
        $this->assertSame('/storage/menu/items/primary.jpg', $activities[0]['primary_image']);
        $this->assertSame([], $activities[0]['images']);
        $this->assertArrayNotHasKey($this->removedDefaultField(), $activities[0]);
    }

    public function test_reorder_updates_sort_order_for_existing_menu_items(): void
    {
        $firstItem = $this->createMenuItem('Nasi Liwet', 'nasi-liwet', 1);
        $secondItem = $this->createMenuItem('Ayam Bakar', 'ayam-bakar', 2);
        $thirdItem = $this->createMenuItem('Sate Ayam', 'sate-ayam', 3);

        app(MenuItemReorder::class)->handle([
            $thirdItem->id,
            $firstItem->id,
            $secondItem->id,
        ]);

        $this->assertSame(2, $firstItem->refresh()->sort_order);
        $this->assertSame(3, $secondItem->refresh()->sort_order);
        $this->assertSame(1, $thirdItem->refresh()->sort_order);
    }

    public function test_serialize_does_not_include_removed_default_field(): void
    {
        $item = $this->createMenuItem('Nasi Liwet', 'nasi-liwet', 1);

        $serialized = app(MenuItemIndex::class)->serialize($item->loadMissing([
            'images',
        ]));

        $this->assertArrayNotHasKey($this->removedDefaultField(), $serialized);
    }

    private function createMenuItem(string $name, string $slug, int $sortOrder): MenuItem
    {
        return MenuItem::query()->create([
            'name' => $name,
            'slug' => $slug,
            'base_price' => 10000,
            'sort_order' => $sortOrder,
        ]);
    }

    private function removedDefaultField(): string
    {
        return 'is_'.'default';
    }
}
