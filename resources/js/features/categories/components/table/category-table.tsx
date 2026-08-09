import { Tags } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DataTable,
    DataTableMediaCardSkeletonRows,
    DataTableMediaTableSkeletonRows,
} from '@/components/data-table';
import { cn } from '@/lib/utils';

import type { CategoryTableProps } from '../../types/category-types';
import { CategoryCard } from './category-card';
import { buildCategoryColumns } from './category-table-columns';
import { CategoryEmptyIcon } from './category-table-parts';
import { CategoryTableSkeletonCells } from './category-table-skeleton';
import { CategoryTableToolbar } from './category-table-toolbar';

export function CategoryTable({
    appendLoadingRowCount = 0,
    categories,
    filters,
    isLoading,
    canMove,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
    onReorder,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    pageCount,
    pageIndex,
    pageSize,
    pageSizeOptions,
    searchValue,
    showSearch = true,
    totalItems,
    toolbar,
    visibleItemFrom,
    visibleItemTo,
}: CategoryTableProps) {
    const canReorder = Boolean(canMove && onReorder);
    const shouldAppendLoadingRows = Boolean(
        isLoading && appendLoadingRowCount > 0,
    );

    return (
        <DataTable
            data={categories}
            columns={buildCategoryColumns({
                canMove,
                canReorder,
                onActiveChange,
                onDelete,
                onEdit,
                onMove,
            })}
            emptyTitle="Kategori Tidak Ditemukan"
            emptyDescription="Belum ada kategori yang ditambahkan atau tidak ada kategori yang sesuai dengan filter Anda."
            emptyIcon={<CategoryEmptyIcon />}
            enableReordering={canReorder}
            getRowId={(category) => category.key}
            manualPagination={pageCount !== undefined}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            onReorder={onReorder}
            pageCount={pageCount}
            pageIndex={pageIndex}
            rowCount={totalItems}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            className="gap-3"
            cardListClassName="w-full max-w-full gap-0"
            tableWrapperClassName="rounded-md"
            renderCard={({ row, table }) => (
                <CategoryCard
                    category={row.original}
                    canMove={canMove}
                    rowCount={table.getRowModel().rows.length}
                    rowIndex={row.index}
                    onActiveChange={onActiveChange}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onMove={onMove}
                />
            )}
            renderCardAppend={
                shouldAppendLoadingRows
                    ? () => (
                          <DataTableMediaCardSkeletonRows
                              rowCount={appendLoadingRowCount}
                          />
                      )
                    : undefined
            }
            renderTableBodyAppend={
                shouldAppendLoadingRows
                    ? ({ columnsLength }) => (
                          <DataTableMediaTableSkeletonRows
                              colSpan={columnsLength}
                              rowCount={appendLoadingRowCount}
                              showLeadingColumn={canReorder}
                              renderCells={(index) => (
                                  <CategoryTableSkeletonCells
                                      index={index}
                                      showLeadingColumn={canReorder}
                                  />
                              )}
                          />
                      )
                    : undefined
            }
            renderToolbar={() => (
                <CategoryTableHeader
                    filters={filters}
                    isLoading={isLoading}
                    onFilterChange={onFilterChange}
                    onSearchChange={onSearchChange}
                    searchValue={searchValue}
                    showSearch={showSearch}
                    totalItems={totalItems}
                    toolbar={toolbar}
                    visibleItemFrom={visibleItemFrom}
                    visibleItemTo={visibleItemTo}
                />
            )}
            renderContent={(content) => (
                <CategoryTableContent isLoading={isLoading}>
                    {content}
                </CategoryTableContent>
            )}
        />
    );
}

function CategoryTableHeader({
    filters,
    isLoading,
    onFilterChange,
    onSearchChange,
    searchValue,
    showSearch,
    totalItems,
    toolbar,
    visibleItemFrom,
    visibleItemTo,
}: {
    filters: CategoryTableProps['filters'];
    isLoading?: boolean;
    onFilterChange?: CategoryTableProps['onFilterChange'];
    onSearchChange?: (value: string) => void;
    searchValue?: string;
    showSearch: boolean;
    totalItems?: number;
    toolbar?: ReactNode;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
}) {
    return (
        <div className="flex flex-col gap-3">
            {toolbar ??
                (showSearch ? (
                    <CategoryTableToolbar
                        filters={filters}
                        search={searchValue ?? ''}
                        onFilterChange={onFilterChange}
                        onSearchChange={onSearchChange}
                    />
                ) : null)}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                        <Tags className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-md truncate font-semibold tracking-normal">
                            Daftar Kategori
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {categoryTableSummary({
                                isLoading,
                                totalItems,
                                visibleItemFrom,
                                visibleItemTo,
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryTableContent({
    children,
    isLoading,
}: {
    children: ReactNode;
    isLoading?: boolean;
}) {
    return (
        <div
            aria-busy={isLoading || undefined}
            className="relative grid min-w-0 gap-4 overflow-x-hidden overflow-y-auto md:overflow-x-auto"
        >
            {isLoading ? (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden rounded-full">
                    <div className="h-full w-1/3 animate-loading-bar rounded-full bg-primary" />
                </div>
            ) : null}
            <div
                className={cn(
                    'grid gap-4 transition-opacity duration-200',
                    isLoading && 'opacity-60',
                )}
            >
                {children}
            </div>
        </div>
    );
}

function categoryTableSummary({
    isLoading,
    totalItems,
    visibleItemFrom,
    visibleItemTo,
}: {
    isLoading?: boolean;
    totalItems?: number;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
}): string {
    if (isLoading) {
        return 'Memuat data kategori...';
    }

    if (
        totalItems !== undefined &&
        visibleItemFrom !== undefined &&
        visibleItemTo !== undefined &&
        visibleItemFrom !== null &&
        visibleItemTo !== null
    ) {
        return `Menampilkan ${visibleItemFrom}-${visibleItemTo} dari ${totalItems} kategori`;
    }

    if (totalItems !== undefined) {
        return `${totalItems} kategori`;
    }

    return 'Kelola kategori menu dan paket';
}
