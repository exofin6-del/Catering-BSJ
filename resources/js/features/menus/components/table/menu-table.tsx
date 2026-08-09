import type { Table as TanStackTable } from '@tanstack/react-table';
import { Search, Utensils } from 'lucide-react';
import type { ReactNode } from 'react';

import {
    DataTable,
    DataTableExportButton,
    DataTableMediaCardSkeletonRows,
    DataTableMediaTableSkeletonRows,
} from '@/components/data-table';
import type {
    DataTableExportChip,
    DataTableToolbarRenderContext,
} from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MenuItem } from '@/types';

import type { MenuTableProps } from '../../types/menu-types';
import { formatMenuPrice, resolveMenuPrice } from '../../utils/menu-price';
import { MenuCard } from './menu-card';
import { buildMenuColumns } from './menu-table-columns';
import { MenuTableSkeletonCells } from './menu-table-skeleton';

export function MenuTable({
    appendLoadingRowCount = 0,
    canMove,
    items,
    isLoading,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
    onView,
    onPageChange,
    onPageSizeChange,
    onReorder,
    onSearchChange,
    pageCount,
    pageIndex,
    pageSize,
    pageSizeOptions,
    searchValue,
    serverExport,
    showSearch = true,
    totalItems,
    toolbar,
    visibleItemFrom,
    visibleItemTo,
    chips,
}: MenuTableProps) {
    const canReorder = Boolean(canMove && onReorder);
    const showSelectionColumn = Boolean(chips?.length);
    const showLeadingControlColumn = canReorder || showSelectionColumn;
    const shouldAppendLoadingRows = appendLoadingRowCount > 0;

    return (
        <DataTable
            data={items}
            columns={buildMenuColumns({
                canMove,
                canReorder,
                onActiveChange,
                onDelete,
                onEdit,
                onMove,
                onView,
            })}
            emptyTitle="Menu Tidak Ditemukan"
            emptyDescription="Belum ada menu yang ditambahkan atau tidak ada menu yang sesuai dengan pencarian Anda."
            emptyIcon={<Utensils className="size-6" />}
            enableRowSelection={Boolean(chips?.length)}
            enableReordering={canReorder}
            getRowId={(item, index) => String(item.id ?? index)}
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
            renderCardAppend={
                shouldAppendLoadingRows
                    ? () => (
                          <DataTableMediaCardSkeletonRows
                              rowCount={appendLoadingRowCount}
                          />
                      )
                    : undefined
            }
            renderCard={({ row, table }) => (
                <MenuCard
                    canMove={canMove}
                    item={row.original}
                    onActiveChange={onActiveChange}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onMove={onMove}
                    onView={onView}
                    rowCount={table.getRowModel().rows.length}
                    rowIndex={row.index}
                />
            )}
            renderToolbar={(table, context) => (
                <MenuTableHeader
                    table={table}
                    exportContext={context}
                    isLoading={isLoading}
                    onSearchChange={onSearchChange}
                    searchValue={searchValue}
                    serverExport={serverExport}
                    showSearch={showSearch}
                    toolbar={toolbar}
                    totalItems={totalItems}
                    visibleItemFrom={visibleItemFrom}
                    visibleItemTo={visibleItemTo}
                    chips={chips}
                />
            )}
            renderTableBodyAppend={
                shouldAppendLoadingRows
                    ? ({ columnsLength }) => (
                          <DataTableMediaTableSkeletonRows
                              colSpan={columnsLength}
                              rowCount={appendLoadingRowCount}
                              showLeadingColumn={showLeadingControlColumn}
                              renderCells={(index) => (
                                  <MenuTableSkeletonCells
                                      index={index}
                                      showLeadingColumn={
                                          showLeadingControlColumn
                                      }
                                  />
                              )}
                          />
                      )
                    : undefined
            }
            renderContent={(content) => (
                <MenuTableContent
                    isLoading={isLoading}
                    isDimmed={isLoading && !shouldAppendLoadingRows}
                >
                    {content}
                </MenuTableContent>
            )}
        />
    );
}

function MenuTableHeader({
    isLoading,
    onSearchChange,
    searchValue,
    serverExport,
    showSearch,
    toolbar,
    totalItems,
    visibleItemFrom,
    visibleItemTo,
    table,
    chips,
    exportContext,
}: {
    isLoading?: boolean;
    onSearchChange?: (value: string) => void;
    searchValue?: string;
    serverExport?: MenuTableProps['serverExport'];
    showSearch: boolean;
    table: TanStackTable<MenuItem>;
    toolbar?: ReactNode;
    totalItems?: number;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
    chips?: DataTableExportChip[];
    exportContext: DataTableToolbarRenderContext;
}) {
    return (
        <div className="flex flex-col gap-3">
            {toolbar ?? (
                <>
                    {showSearch ? (
                        <div className="relative max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={searchValue ?? ''}
                                placeholder="Cari menu..."
                                onChange={(event) =>
                                    onSearchChange?.(event.target.value)
                                }
                                className="pl-9"
                            />
                        </div>
                    ) : null}
                </>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted">
                        <Utensils className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-md truncate font-semibold tracking-normal">
                            Daftar Menu
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {menuTableSummary({
                                isLoading,
                                totalItems,
                                visibleItemFrom,
                                visibleItemTo,
                            })}
                        </p>
                    </div>
                </div>

                <DataTableExportButton
                    table={table}
                    filename="menu.csv"
                    formatRow={formatMenuExportRow}
                    chips={chips}
                    isExportSelectionMode={exportContext.isExportSelectionMode}
                    onExportSelectionModeChange={
                        exportContext.setIsExportSelectionMode
                    }
                    selectedRowCount={exportContext.selectedRowCount}
                    serverExport={serverExport}
                />
            </div>
        </div>
    );
}

function MenuTableContent({
    children,
    isLoading,
    isDimmed = isLoading,
}: {
    children: ReactNode;
    isLoading?: boolean;
    isDimmed?: boolean;
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
                    isDimmed && 'opacity-60',
                )}
            >
                {children}
            </div>
        </div>
    );
}

function menuTableSummary({
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
        return 'Memuat data menu...';
    }

    if (
        totalItems !== undefined &&
        visibleItemFrom !== undefined &&
        visibleItemTo !== undefined &&
        visibleItemFrom !== null &&
        visibleItemTo !== null
    ) {
        return `Menampilkan ${visibleItemFrom}-${visibleItemTo} dari ${totalItems} menu`;
    }

    if (totalItems !== undefined) {
        return `${totalItems} menu`;
    }

    return 'Kelola item menu katalog';
}

function formatMenuExportRow(item: MenuItem) {
    const price = resolveMenuPrice(item);

    return {
        ID: item.id ?? '',
        Menu: item.name,
        Kategori: item.menu_category?.name ?? 'Tanpa kategori',
        Harga: formatMenuPrice(price.displayPrice),
        'Harga Normal': formatMenuPrice(price.originalPrice),
        Promo: price.hasPromo ? 'Ya' : 'Tidak',
        'Min. Order': item.min_order ?? 1,
        Status: item.is_active ? 'Aktif' : 'Nonaktif',
        Rekomendasi: item.is_recommended ? 'Ya' : 'Tidak',
    };
}
