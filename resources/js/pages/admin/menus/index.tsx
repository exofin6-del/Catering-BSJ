import { Head, router } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import type { DataTableExportChip } from '@/components/data-table';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MenuStatsDonutChart } from '@/features/menus/components/chart/menu-stats-donut-chart';
import { MenuTopOrderedBarChart } from '@/features/menus/components/chart/menu-top-ordered-bar-chart';
import { MenuTable } from '@/features/menus/components/table/menu-table';
import { MenuTableToolbar } from '@/features/menus/components/table/menu-table-toolbar';
import { useMenuTable } from '@/features/menus/hooks/use-menu-table';
import type { MenuIndexProps } from '@/features/menus/types/menu-types';
import {
    defaultMenuIndexStats,
    defaultMenuTopOrderedItems,
} from '@/features/menus/utils/menu-stats-chart';
import {
    buildMenuIndexQuery,
    defaultMenuIndexFilters,
    defaultMenuIndexItems,
} from '@/features/menus/utils/menu-table';
import { dashboard } from '@/routes';
import menu from '@/routes/menu';

const emptyActivityItems: NonNullable<MenuIndexProps['activityItems']> = [];
const emptyCategories: NonNullable<MenuIndexProps['categories']> = [];

export default function MenuIndexPage(props: MenuIndexProps) {
    const activityItems = props.activityItems ?? emptyActivityItems;
    const categories = props.categories ?? emptyCategories;
    const filters = props.filters ?? defaultMenuIndexFilters;
    const items = props.items ?? defaultMenuIndexItems;
    const stats = props.stats ?? defaultMenuIndexStats;
    const topOrderedItems = props.topOrderedItems ?? defaultMenuTopOrderedItems;

    const {
        deleteBlockedTarget,
        handleActiveChange,
        handleDeleteRequest,
        handleMove,
        handleReorder,
        isLoading,
        search,
        setDeleteBlockedTarget,
        setSearch,
        visitIndex,
        canReorderCurrentPage,
        displayFilters,
        prefetchIndex,
        appendLoadingRowCount,
    } = useMenuTable({
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
    }, [displayFilters, categories, search, visitIndex, handleSearchChange]);
    const exportQuery = useMemo(
        () =>
            buildMenuIndexQuery({
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
            <Head title="Menu" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-5 lg:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <MenuTableToolbar
                        categories={categories}
                        filters={displayFilters}
                        search={search}
                        onFilterChange={visitIndex}
                        onFilterPrefetch={prefetchIndex}
                        onSearchChange={handleSearchChange}
                    />

                    <div className="grid items-stretch gap-4 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
                        <MenuStatsDonutChart stats={stats} />
                        <MenuTopOrderedBarChart
                            filterChips={exportChips}
                            items={topOrderedItems}
                        />
                    </div>

                    <MenuTable
                        appendLoadingRowCount={appendLoadingRowCount}
                        canMove={canReorderCurrentPage}
                        items={items.data}
                        isLoading={isLoading}
                        onActiveChange={handleActiveChange}
                        onDelete={handleDeleteRequest}
                        onEdit={(item) => {
                            if (item.id !== undefined) {
                                router.visit(menu.edit(item.id));
                            }
                        }}
                        onMove={handleMove}
                        onView={(item) => {
                            if (item.id !== undefined) {
                                router.visit(menu.show(item.id));
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
                            url: menu.export.url(),
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

            <AlertDialog
                open={deleteBlockedTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteBlockedTarget(null);
                    }
                }}
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <CircleAlert className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            Menu masih digunakan
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteBlockedTarget
                                ? deleteBlockedTarget.package_items_count &&
                                  deleteBlockedTarget.package_items_count > 0
                                    ? `Menu "${deleteBlockedTarget.name}" masih dipakai di ${deleteBlockedTarget.package_items_count} paket dan tidak dapat dihapus.`
                                    : `Menu "${deleteBlockedTarget.name}" masih digunakan dan tidak dapat dihapus.`
                                : 'Menu ini masih digunakan dan tidak dapat dihapus.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-center pt-3">
                        <AlertDialogCancel
                            onClick={() => setDeleteBlockedTarget(null)}
                        >
                            Tutup
                        </AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

MenuIndexPage.layout = {
    title: 'Menu',
    description: 'Kelola item menu yang tampil di katalog.',
    action: {
        label: 'Tambah',
        href: menu.create(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Menu',
            href: menu.index(),
        },
    ],
};
