<?php

namespace App\Actions\Admin\Menu;

use App\Models\MenuItem;
use Illuminate\Database\Query\JoinClause;

class MenuItemStats
{
    /**
     * @return array{total: int, active: int, recommended: int, uncategorized: int, promo: int}
     */
    public function handle(): array
    {
        $stats = MenuItem::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN is_recommended = 1 THEN 1 ELSE 0 END) as recommended')
            ->selectRaw('SUM(CASE WHEN menu_category_id IS NULL THEN 1 ELSE 0 END) as uncategorized')
            ->selectRaw('SUM(CASE WHEN promo_price IS NOT NULL THEN 1 ELSE 0 END) as promo')
            ->first();

        return [
            'total' => (int) ($stats?->total ?? 0),
            'active' => (int) ($stats?->active ?? 0),
            'recommended' => (int) ($stats?->recommended ?? 0),
            'uncategorized' => (int) ($stats?->uncategorized ?? 0),
            'promo' => (int) ($stats?->promo ?? 0),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function recentActivities(int $limit = 5): array
    {
        return MenuItem::query()
            ->select([
                'menu_items.id',
                'menu_items.name',
                'menu_items.slug',
                'menu_items.base_price',
                'menu_items.promo_price',
                'menu_items.description',
                'menu_items.min_order',
                'menu_items.is_recommended',
                'menu_items.sort_order',
                'menu_items.is_active',
                'menu_items.created_at',
                'menu_items.updated_at',
                'primary_images.image_url as primary_image_url',
            ])
            ->leftJoin('menu_images as primary_images', function (JoinClause $join): void {
                $join
                    ->on('primary_images.menu_item_id', '=', 'menu_items.id')
                    ->where('primary_images.is_primary', true);
            })
            ->orderByRaw('COALESCE(menu_items.updated_at, menu_items.created_at) DESC')
            ->orderByDesc('menu_items.id')
            ->limit($limit)
            ->get()
            ->map(fn (MenuItem $item): array => $this->serializeRecentActivity($item))
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeRecentActivity(MenuItem $item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'slug' => $item->slug,
            'base_price' => $item->base_price,
            'promo_price' => $item->promo_price,
            'description' => $item->description,
            'min_order' => $item->min_order,
            'is_recommended' => $item->is_recommended,
            'sort_order' => $item->sort_order,
            'is_active' => $item->is_active,
            'created_at' => $item->created_at?->toISOString(),
            'updated_at' => $item->updated_at?->toISOString(),
            'creator' => null,
            'updater' => null,
            'primary_image' => $item->getAttribute('primary_image_url'),
            'images' => [],
            'menu_category' => null,
        ];
    }
}
