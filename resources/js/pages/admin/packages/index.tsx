import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

import type { DataTableExportChip } from '@/components/data-table';
import { PackageStatsDonutChart } from '@/features/packages/components/chart/package-stats-donut-chart';
import { PackageTopOrderedBarChart } from '@/features/packages/components/chart/package-top-ordered-bar-chart';
import { PackageDeleteDialog } from '@/features/packages/components/table/package-delete-dialog';
import { PackageTable } from '@/features/packages/components/table/package-table';
import { PackageTableToolbar } from '@/features/packages/components/table/package-table-toolbar';
import { usePackageTable } from '@/features/packages/hooks/use-package-table';
import type { PackageIndexProps } from '@/features/packages/types/package-types';
import {
    buildPackageIndexQuery,
    defaultPackageIndexFilters,
    defaultPackageIndexItems,
    defaultPackageIndexStats,
    defaultPackageTopOrderedItems,
} from '@/features/packages/utils/package-table';
import { dashboard } from '@/routes';
import paket from '@/routes/paket';

const emptyActivityItems: NonNullable<PackageIndexProps['activityItems']> = [];
const emptyCategories: NonNullable<PackageIndexProps['packageCategories']> = [];

export default function PackageIndexPage(props: PackageIndexProps) {
    const activityItems = props.activityItems ?? emptyActivityItems;
    const categories = props.packageCategories ?? emptyCategories;
    const filters = props.filters ?? defaultPackageIndexFilters;
    const items = props.items ?? defaultPackageIndexItems;
    const stats = props.stats ?? defaultPackageIndexStats;
    const topOrderedPackages =
        props.topOrderedPackages ?? defaultPackageTopOrderedItems;
    const {
        canReorderCurrentPage,
        deleteTarget,
        displayFilters,
        handleActiveChange,
        handleDeleteConfirm,
        handleDeleteRequest,
        handleMove,
        handleReorder,
        isLoading,
        prefetchIndex,
        search,
        setDeleteTarget,
        setSearch,
        visitIndex,
    } = usePackageTable({
        activityItems,
        filters,
        items,
        stats,
    });

    const handlePageChange = useCallback(
        (pageIndex: number) => {
            visitIndex({
                page: pageIndex + 1,
            });
        },
        [visitIndex],
    );

    const handlePageSizeChange = useCallback(
        (pageSize: number) => {
            visitIndex({
                page: 1,
                perPage: pageSize,
            });
        },
        [visitIndex],
    );

    const handleSearchChange = useCallback(
        (value: string) => {
            setSearch(value);
        },
        [setSearch],
    );

    const exportChips = useMemo<DataTableExportChip[]>(() => {
        const chips: DataTableExportChip[] = [];

        if (displayFilters.category_id !== null) {
            const category = categories.find(
                (c) => c.id === displayFilters.category_id,
            );

            if (category) {
                chips.push({
                    id: 'category',
                    label: 'Kategori',
                    value: category.name,
                    onRemove: () => visitIndex({ categoryId: null, page: 1 }),
                });
            }
        }

        if (displayFilters.status !== 'all') {
            chips.push({
                id: 'status',
                label: 'Status',
                value:
                    displayFilters.status === 'active' ? 'Aktif' : 'Nonaktif',
                onRemove: () => visitIndex({ status: 'all', page: 1 }),
            });
        }

        if (displayFilters.promo !== 'all') {
            chips.push({
                id: 'promo',
                label: 'Promo',
                value: displayFilters.promo === 'yes' ? 'Ya' : 'Tidak',
                onRemove: () => visitIndex({ promo: 'all', page: 1 }),
            });
        }

        if (displayFilters.recommended !== 'all') {
            chips.push({
                id: 'recommended',
                label: 'Rekomendasi',
                value: displayFilters.recommended === 'yes' ? 'Ya' : 'Tidak',
                onRemove: () => visitIndex({ recommended: 'all', page: 1 }),
            });
        }

        if (search) {
            chips.push({
                id: 'search',
                label: 'Pencarian',
                value: search,
                onRemove: () => handleSearchChange(''),
            });
        }

        return chips;
    }, [categories, displayFilters, handleSearchChange, search, visitIndex]);
    const exportQuery = useMemo(
        () =>
            buildPackageIndexQuery({
                categoryId: displayFilters.category_id,
                page: 1,
                perPage: displayFilters.per_page,
                promo: displayFilters.promo,
                recommended: displayFilters.recommended,
                search,
                sortBy: displayFilters.sort_by,
                sortDir: displayFilters.sort_dir,
                status: displayFilters.status,
            }),
        [displayFilters, search],
    );

    return (
        <>
            <Head title="Paket" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-5 lg:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <PackageTableToolbar
                        categories={categories}
                        filters={displayFilters}
                        search={search}
                        onFilterChange={visitIndex}
                        onFilterPrefetch={prefetchIndex}
                        onSearchChange={handleSearchChange}
                    />

                    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
                        <PackageStatsDonutChart stats={stats} />
                        <PackageTopOrderedBarChart
                            filterChips={exportChips}
                            items={topOrderedPackages}
                        />
                    </div>

                    <PackageTable
                        canMove={canReorderCurrentPage}
                        items={items.data}
                        isLoading={isLoading}
                        onActiveChange={handleActiveChange}
                        onDelete={handleDeleteRequest}
                        onEdit={(item) => {
                            if (item.id !== undefined) {
                                router.visit(paket.edit(item.id));
                            }
                        }}
                        onMove={handleMove}
                        onView={(item) => {
                            if (item.id !== undefined) {
                                router.visit(paket.show(item.id));
                            }
                        }}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onReorder={handleReorder}
                        onSearchChange={handleSearchChange}
                        pageCount={items.last_page}
                        pageIndex={items.current_page - 1}
                        pageSize={displayFilters.per_page}
                        pageSizeOptions={displayFilters.per_page_options}
                        searchValue={search}
                        serverExport={{
                            url: paket.export.url(),
                            query: exportQuery,
                            total: items.total,
                        }}
                        showSearch={false}
                        chips={exportChips}
                        totalItems={items.total}
                        visibleItemFrom={items.from}
                        visibleItemTo={items.to}
                    />
                </div>
            </div>

            <PackageDeleteDialog
                item={deleteTarget}
                open={deleteTarget !== null}
                onConfirm={handleDeleteConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            />
        </>
    );
}

PackageIndexPage.layout = {
    title: 'Paket',
    description: 'Kelola paket menu yang tampil di katalog.',
    action: {
        label: 'Tambah',
        href: paket.create(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Paket',
            href: paket.index(),
        },
    ],
};
