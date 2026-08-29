<?php

namespace App\Actions\Admin\Menu;

use App\Models\MenuItem;
use Illuminate\Support\Facades\DB;

class MenuItemReorder
{
    /**
     * @param  array<int, int>  $menuItemIds
     */
    public function handle(array $menuItemIds): void
    {
        DB::transaction(function () use ($menuItemIds): void {
            foreach ($menuItemIds as $index => $menuItemId) {
                MenuItem::query()
                    ->whereKey($menuItemId)
                    ->update([
                        'sort_order' => $index + 1,
                    ]);
            }
        });
    }

    public function moveToSortOrder(
        int $menuItemId,
        int $targetSortOrder,
    ): void {
        DB::transaction(function () use ($menuItemId, $targetSortOrder): void {
            $menuItem = MenuItem::query()
                ->whereKey($menuItemId)
                ->lockForUpdate()
                ->firstOrFail();

            $currentSortOrder = (int) $menuItem->sort_order;
            $targetSortOrder = max(1, $targetSortOrder);

            if ($currentSortOrder === $targetSortOrder) {
                return;
            }

            if ($currentSortOrder < $targetSortOrder) {
                MenuItem::query()
                    ->where('sort_order', '>', $currentSortOrder)
                    ->where('sort_order', '<=', $targetSortOrder)
                    ->decrement('sort_order');
            } else {
                MenuItem::query()
                    ->where('sort_order', '>=', $targetSortOrder)
                    ->where('sort_order', '<', $currentSortOrder)
                    ->increment('sort_order');
            }

            $menuItem->update([
                'sort_order' => $targetSortOrder,
            ]);
        });
    }
}
