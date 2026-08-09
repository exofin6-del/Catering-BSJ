import { Head, router } from '@inertiajs/react';
import { CircleAlert } from 'lucide-react';
import { useCallback } from 'react';

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CategoryTable } from '@/features/categories/components/table/category-table';
import { CategoryTableToolbar } from '@/features/categories/components/table/category-table-toolbar';
import { useCategoryTable } from '@/features/categories/hooks/use-category-table';
import type { CategoryIndexProps } from '@/features/categories/types/category-types';
import {
    defaultCategoryIndexCategoryOptions,
    defaultCategoryIndexFilters,
    defaultCategoryIndexItems,
} from '@/features/categories/utils/category-table';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';

export default function CategoryIndex(props: CategoryIndexProps) {
    const categoryOptions =
        props.category_options ?? defaultCategoryIndexCategoryOptions;
    const filters = props.filters ?? defaultCategoryIndexFilters;
    const items = props.items ?? defaultCategoryIndexItems;

    const {
        blockedDeleteTarget,
        canReorderCurrentPage,
        displayFilters,
        handleActiveChange,
        handleDelete,
        handleMove,
        handleReorder,
        isLoading,
        prefetchIndex,
        search,
        setBlockedDeleteTarget,
        setSearch,
        visitIndex,
    } = useCategoryTable({
        filters,
        items,
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

    return (
        <>
            <Head title="Kategori" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-5 lg:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <CategoryTableToolbar
                        categoryOptions={categoryOptions}
                        filters={displayFilters}
                        search={search}
                        onFilterChange={visitIndex}
                        onFilterPrefetch={prefetchIndex}
                        onSearchChange={setSearch}
                    />

                    <CategoryTable
                        categories={items.data}
                        canMove={canReorderCurrentPage}
                        filters={displayFilters}
                        isLoading={isLoading}
                        onActiveChange={handleActiveChange}
                        onDelete={handleDelete}
                        onEdit={(category) => {
                            router.visit(
                                categories.edit([category.type, category.id]),
                            );
                        }}
                        onMove={handleMove}
                        onReorder={handleReorder}
                        onFilterChange={visitIndex}
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onSearchChange={setSearch}
                        pageCount={items.last_page}
                        pageIndex={items.current_page - 1}
                        pageSize={displayFilters.per_page}
                        pageSizeOptions={displayFilters.per_page_options}
                        searchValue={search}
                        showSearch={false}
                        totalItems={items.total}
                        visibleItemFrom={items.from}
                        visibleItemTo={items.to}
                    />
                </div>
            </div>

            <AlertDialog
                open={blockedDeleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setBlockedDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <CircleAlert className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            Kategori masih digunakan
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {blockedDeleteTarget
                                ? `Kategori "${blockedDeleteTarget.name}" masih dipakai di ${blockedDeleteTarget.usage_label}. Anda tidak dapat menghapusnya.`
                                : 'Kategori ini masih digunakan dan tidak dapat dihapus.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-center pt-3">
                        <AlertDialogCancel
                            onClick={() => setBlockedDeleteTarget(null)}
                        >
                            Tutup
                        </AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

CategoryIndex.layout = {
    title: 'Kategori',
    description: 'Kelola kategori menu dan paket dalam satu tempat.',
    action: {
        label: 'Tambah',
        href: categories.create(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kategori',
            href: categories.index(),
        },
    ],
};
