<?php

namespace App\Http\Controllers\Category;

use App\Actions\Category\CategoryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Category\ReorderCategoriesRequest;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryStatusRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        private readonly CategoryAction $categories,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('admin/kategori/index', $this->pageProps($request));
    }

    public function create(Request $request): Response
    {
        $type = (string) $request->query('type', 'menu');

        return Inertia::render('admin/kategori/create', [
            'type' => in_array($type, ['menu', 'paket'], true) ? $type : 'menu',
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $category = $this->categories->create($request->categoryData());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name created.', ['name' => $category['name']]),
        ]);

        return to_route('categories.index');
    }

    public function edit(string $type, int $category): Response
    {
        return Inertia::render('admin/kategori/edit', [
            'category' => $this->categories->find($type, $category),
        ]);
    }

    public function update(UpdateCategoryRequest $request, string $type, int $category): RedirectResponse
    {
        $categoryData = $this->categories->update($type, $category, $request->categoryData());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __(':name updated.', ['name' => $categoryData['name']]),
        ]);

        return to_route('categories.index');
    }

    public function status(UpdateCategoryStatusRequest $request, string $type, int $category): RedirectResponse
    {
        $this->categories->updateStatus($type, $category, $request->isActive());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category status updated.')]);

        return to_route('categories.index');
    }

    public function destroy(string $type, int $category): RedirectResponse
    {
        if (! $this->categories->delete($type, $category)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => __('Category is still used.'),
            ]);

            return to_route('categories.index');
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Category deleted.')]);

        return to_route('categories.index');
    }

    public function reorder(ReorderCategoriesRequest $request): RedirectResponse
    {
        $type = $request->type() ?? $request->input('type', 'menu');
        $movedCategoryId = $request->movedCategoryId();
        $targetSortOrder = $request->targetSortOrder();

        if ($movedCategoryId !== null && $targetSortOrder !== null) {
            $this->categories->moveToSortOrder($type, $movedCategoryId, $targetSortOrder);
        } else {
            $this->categories->reorder($type, $request->categoryIds());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Kategori berhasil diurutkan.')]);

        return to_route('categories.index');
    }

    /**
     * @return array{items: LengthAwarePaginator<int, array<string, mixed>>, filters: array{search: string, per_page: int, per_page_options: array<int, int>, type: string, category_id: int|null}, category_options: array<int, array{id: int, name: string, type: string}>}
     */
    private function pageProps(Request $request): array
    {
        $filters = $this->categories->normalizeIndexFilters($request->only([
            'category_id',
            'per_page',
            'search',
            'type',
        ]));

        return [
            'items' => $this->categories->index($filters),
            'filters' => $filters,
            'category_options' => $this->categories->categoryOptions($filters),
        ];
    }
}
