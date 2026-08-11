<?php

namespace App\Http\Controllers\Menu;

use App\Actions\Menu\MenuItemAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\ReorderMenuItemsRequest;
use App\Http\Requests\Menu\StoreMenuItemRequest;
use App\Http\Requests\Menu\UpdateMenuItemRequest;
use App\Http\Requests\Menu\UpdateMenuItemStatusRequest;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuItemAction $menuItems,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('admin/menus/index', $this->pageProps($request));
    }

    public function export(Request $request): JsonResponse
    {
        $filters = $this->menuItems->normalizeIndexFilters($request->only([
            'category_id',
            'per_page',
            'promo',
            'recommended',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));
        $data = $this->menuItems->export($filters);

        return response()->json([
            'data' => $data,
            'total' => count($data),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create', [
            'categories' => $this->categories(),
        ]);
    }

    public function temporaryImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', File::image()],
        ]);

        $image = $request->file('image');

        abort_unless($image instanceof UploadedFile, 422);

        return response()->json(
            $this->menuItems->temporaryImage($image),
        );
    }

    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $this->menuItems->create(
            data: $request->safe()->except('image'),
            image: $request->image(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name created.', [
                'name' => $request->validated('name'),
            ]),
        ]);

        return to_route('menu.index');
    }

    public function show(MenuItem $menuItem): Response
    {
        return Inertia::render('admin/menus/show', [
            'item' => $this->serializeItem($menuItem),
        ]);
    }

    public function edit(MenuItem $menuItem): Response
    {
        return Inertia::render('admin/menus/edit', [
            'categories' => $this->categories(),
            'item' => $this->serializeItem($menuItem),
        ]);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
    {
        $this->menuItems->update(
            item: $menuItem,
            data: $request->safe()->except('image'),
            image: $request->image(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name updated.', [
                'name' => $request->validated('name'),
            ]),
        ]);

        return to_route('menu.index');
    }

    public function destroy(MenuItem $menuItem): RedirectResponse
    {
        $name = $menuItem->name;

        if ($menuItem->packageItems()->exists() || $menuItem->orderItems()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Menu is still used in packages or orders.'),
            ]);

            return to_route('menu.index');
        }

        $this->menuItems->delete($menuItem);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name deleted.', [
                'name' => $name,
            ]),
        ]);

        return to_route('menu.index');
    }

    public function status(UpdateMenuItemStatusRequest $request, MenuItem $menuItem): RedirectResponse
    {
        $this->menuItems->updateStatus(
            item: $menuItem,
            isActive: $request->isActive(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Menu status updated.'),
        ]);

        return to_route('menu.index');
    }

    public function reorder(ReorderMenuItemsRequest $request): RedirectResponse
    {
        $movedMenuItemId = $request->movedMenuItemId();
        $targetSortOrder = $request->targetSortOrder();

        if ($movedMenuItemId !== null && $targetSortOrder !== null) {
            $this->menuItems->moveToSortOrder($movedMenuItemId, $targetSortOrder);
        } else {
            $this->menuItems->reorder($request->menuItemIds());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Menu items reordered.')]);

        return to_route('menu.index');
    }

    private function serializeItem(MenuItem $item): array
    {
        return $this->menuItems->serialize($item->loadMissing($this->itemRelations()));
    }

    /**
     * @return array{
     *     items: callable(): LengthAwarePaginator<int, array<string, mixed>>,
     *     activityItems: callable(): array<int, array<string, mixed>>,
     *     categories: callable(): array<int, array{id: int, name: string}>,
     *     filters: array<string, mixed>,
     *     stats: callable(): array{total: int, active: int, recommended: int, uncategorized: int, promo: int},
     *     topOrderedItems: callable(): array<int, array{id: int, name: string, ordered_count: int}>,
     *     mode: string,
     *     item: null
     * }
     */
    private function pageProps(Request $request): array
    {
        $filters = $this->menuItems->normalizeIndexFilters($request->only([
            'category_id',
            'per_page',
            'promo',
            'recommended',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));

        return [
            'items' => fn (): LengthAwarePaginator => $this->menuItems->index($filters),
            'activityItems' => fn (): array => $this->menuItems->recentActivities(),
            'categories' => fn (): array => $this->categories(),
            'filters' => $filters,
            'stats' => fn (): array => $this->menuItems->stats(),
            'topOrderedItems' => fn (): array => $this->menuItems->topOrderedItems($filters),
            'mode' => 'index',
            'item' => null,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function itemRelations(): array
    {
        return [
            'category:id,name,icon',
            'creator:id,name',
            'updater:id,name',
            'images:id,menu_item_id,image_url,is_primary,sort_order',
            'primaryImage:id,menu_item_id,image_url',
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, icon: string|null}>
     */
    private function categories(): array
    {
        return cache()->remember('menu_categories', now()->addDay(), function (): array {
            return MenuCategory::query()
                ->active()
                ->ordered()
                ->get(['id', 'name', 'icon'])
                ->map(fn (MenuCategory $category): array => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'icon' => $category->icon,
                ])
                ->values()
                ->all();
        });
    }
}
