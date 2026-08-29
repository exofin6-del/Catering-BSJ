<?php

namespace App\Http\Resources\Menu;

use App\Actions\Admin\Menu\MenuItemFilters;
use App\Actions\Admin\Menu\MenuItemIndex;
use App\Actions\Admin\Menu\MenuItemStats;
use App\Models\MenuCategory;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class MenuPageProps
{
    public function __construct(
        private readonly MenuItemIndex $menuItems,
        private readonly MenuItemFilters $filters,
        private readonly MenuItemStats $stats,
    ) {}

    /**
     * @return array{
     *     items: callable(): LengthAwarePaginator<int, mixed>,
     *     activityItems: callable(): array<int, array<string, mixed>>,
     *     categories: callable(): array<int, array{
     *         id: int,
     *         name: string,
     *         icon: string|null
     *     }>,
     *     filters: array<string, mixed>,
     *     stats: callable(): array{total: int, active: int, recommended: int, uncategorized: int, promo: int},
     *     topOrderedItems: callable(): array<int, array{id: int, name: string, ordered_count: int}>,
     *     mode: string,
     *     item: null
     * }
     */
    public function build(Request $request): array
    {
        $filters = $this->filters->normalize(
            $request->only([
                'category_id',
                'per_page',
                'promo',
                'recommended',
                'search',
                'sort_by',
                'sort_dir',
                'status',
            ])
        );

        return [
            'items' => fn (): LengthAwarePaginator => $this->menuItems->handle($filters),

            'activityItems' => fn (): array => $this->stats->recentActivities(),

            'categories' => fn (): array => $this->categories(),

            'filters' => $filters,

            'stats' => fn (): array => $this->stats->handle(),

            'topOrderedItems' => fn (): array => $this->menuItems->topOrderedItems($filters),

            'mode' => 'index',

            'item' => null,
        ];
    }

    /**
     * @return array<int, array{
     *     id: int,
     *     name: string,
     *     icon: string|null
     * }>
     */
    public function categories(): array
    {
        return cache()->remember(
            'menu_categories',
            now()->addDay(),
            fn (): array => MenuCategory::query()
                ->active()
                ->ordered()
                ->get([
                    'id',
                    'name',
                    'icon',
                ])
                ->map(
                    fn (MenuCategory $category): array => [
                        'id' => $category->id,
                        'name' => $category->name,
                        'icon' => $category->icon,
                    ]
                )
                ->values()
                ->all()
        );
    }
}
