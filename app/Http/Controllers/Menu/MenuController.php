<?php

namespace App\Http\Controllers\Menu;

use App\Actions\Admin\Menu\MenuImageAction;
use App\Actions\Admin\Menu\MenuItemAction;
use App\Actions\Admin\Menu\MenuItemExport;
use App\Actions\Admin\Menu\MenuItemFilters;
use App\Actions\Admin\Menu\MenuItemIndex;
use App\Actions\Admin\Menu\MenuItemReorder;
use App\Http\Controllers\Controller;
use App\Http\Requests\Menu\ReorderMenuItemsRequest;
use App\Http\Requests\Menu\StoreMenuItemRequest;
use App\Http\Requests\Menu\UpdateMenuItemRequest;
use App\Http\Requests\Menu\UpdateMenuItemStatusRequest;
use App\Http\Resources\Menu\MenuPageProps;
use App\Models\MenuItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class MenuController extends Controller
{
    public function __construct(
        private readonly MenuItemAction $menuItems,
        private readonly MenuImageAction $images,
        private readonly MenuItemExport $export,
        private readonly MenuItemFilters $filters,
        private readonly MenuItemIndex $index,
        private readonly MenuItemReorder $reorder,
        private readonly MenuPageProps $pageProps,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('admin/menus/index', $this->pageProps->build($request));
    }

    public function export(Request $request): JsonResponse
    {
        $items = $this->export->handle($this->indexFilters($request));

        return response()->json([
            'data' => $items,
            'total' => count($items),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/menus/create', [
            'categories' => $this->pageProps->categories(),
        ]);
    }

    public function temporaryImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', File::image()->max((int) config('cloudinary.max_upload_kilobytes', 20 * 1024))],
        ]);

        $image = $request->file('image');

        abort_unless($image instanceof UploadedFile, 422);

        return response()->json($this->images->temporaryUpload($image));
    }

    public function store(StoreMenuItemRequest $request): RedirectResponse
    {
        $menuItem = $this->menuItems->create(
            data: $request->validated(),
            image: $request->image(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name created.', ['name' => $menuItem->name]),
        ]);

        return to_route('menu.index');
    }

    public function show(MenuItem $menuItem): Response
    {
        return Inertia::render('admin/menus/show', [
            'item' => $this->index->serialize($menuItem),
        ]);
    }

    public function edit(MenuItem $menuItem): Response
    {
        return Inertia::render('admin/menus/edit', [
            'categories' => $this->pageProps->categories(),
            'item' => $this->index->serialize($menuItem),
        ]);
    }

    public function update(UpdateMenuItemRequest $request, MenuItem $menuItem): RedirectResponse
    {
        $updatedMenuItem = $this->menuItems->update(
            item: $menuItem,
            data: $request->validated(),
            image: $request->image(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name updated.', ['name' => $updatedMenuItem->name]),
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
            'message' => __(':name deleted.', ['name' => $name]),
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
            $this->reorder->moveToSortOrder($movedMenuItemId, $targetSortOrder);
        } else {
            $this->reorder->handle($request->menuItemIds());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Menu items reordered.')]);

        return to_route('menu.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function indexFilters(Request $request): array
    {
        return $this->filters->normalize($request->only([
            'category_id',
            'per_page',
            'promo',
            'recommended',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));
    }
}
