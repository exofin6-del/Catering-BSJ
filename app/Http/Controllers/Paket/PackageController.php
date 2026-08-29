<?php

namespace App\Http\Controllers\Paket;

use App\Actions\Admin\Paket\PackageAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Paket\ReorderPackagesRequest;
use App\Http\Requests\Paket\StorePackageRequest;
use App\Http\Requests\Paket\UpdatePackageRequest;
use App\Http\Requests\Paket\UpdatePackageStatusRequest;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function __construct(
        private readonly PackageAction $packages,
    ) {}

    public function index(Request $request): Response
    {
        return Inertia::render('admin/packages/index', $this->pageProps($request));
    }

    public function export(Request $request): JsonResponse
    {
        $filters = $this->packages->normalizeIndexFilters($request->only([
            'category_id',
            'per_page',
            'promo',
            'recommended',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));
        $data = $this->packages->export($filters);

        return response()->json([
            'data' => $data,
            'total' => count($data),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/packages/create', [
            'packageCategories' => $this->packages->categoriesForCommand(),
            'menuItems' => $this->packages->menuItemsForCommand(),
        ]);
    }

    public function temporaryImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', File::image()->max((int) config('cloudinary.max_upload_kilobytes', 20 * 1024))],
        ]);

        $image = $request->file('image');

        abort_unless($image instanceof UploadedFile, 422);

        return response()->json(
            $this->packages->temporaryImage($image),
        );
    }

    public function store(StorePackageRequest $request): RedirectResponse
    {
        $this->packages->create(
            data: $request->validated(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Package created.')]);

        return to_route('paket.index');
    }

    public function edit(Package $package): Response
    {
        return Inertia::render('admin/packages/edit', [
            'menuItems' => $this->packages->menuItemsForCommand(),
            'package' => $this->packages->serialize($package),
            'packageCategories' => $this->packages->categoriesForCommand(),
        ]);
    }

    public function show(Package $package): Response
    {
        return Inertia::render('admin/packages/show', [
            'package' => $this->packages->serialize($package),
        ]);
    }

    public function update(UpdatePackageRequest $request, Package $package): RedirectResponse
    {
        $this->packages->update(
            package: $package,
            data: $request->validated(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Package updated.')]);

        return to_route('paket.index');
    }

    public function destroy(Package $package): RedirectResponse
    {
        $this->packages->delete($package);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Package deleted.')]);

        return to_route('paket.index');
    }

    public function status(UpdatePackageStatusRequest $request, Package $package): RedirectResponse
    {
        $this->packages->updateStatus(
            package: $package,
            isActive: $request->isActive(),
            userId: (int) $request->user()->getAuthIdentifier(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Package status updated.')]);

        return to_route('paket.index');
    }

    public function reorder(ReorderPackagesRequest $request): RedirectResponse
    {
        $movedPackageId = $request->movedPackageId();
        $targetSortOrder = $request->targetSortOrder();

        if ($movedPackageId !== null && $targetSortOrder !== null) {
            $this->packages->moveToSortOrder($movedPackageId, $targetSortOrder);
        } else {
            $this->packages->reorder($request->packageIds());
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Packages reordered.')]);

        return to_route('paket.index');
    }

    /**
     * @return array{items: LengthAwarePaginator<int, array<string, mixed>>, activityItems: array<int, array<string, mixed>>, filters: array<string, mixed>, packageCategories: array<int, array{id: int, name: string}>, stats: array{total: int, active: int, recommended: int, promo: int}, topOrderedPackages: array<int, array{id: int, name: string, ordered_count: int}>, mode: string, package: null}
     */
    private function pageProps(Request $request): array
    {
        $filters = $this->packages->normalizeIndexFilters($request->only([
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
            'items' => $this->packages->index($filters),
            'activityItems' => $this->packages->recentActivities(),
            'filters' => $filters,
            'packageCategories' => $this->packages->categoriesForCommand(),
            'stats' => $this->packages->stats(),
            'topOrderedPackages' => $this->packages->topOrderedPackages($filters),
            'mode' => 'index',
            'package' => null,
        ];
    }
}
