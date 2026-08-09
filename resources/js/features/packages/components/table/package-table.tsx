import type { Table as TanStackTable } from '@tanstack/react-table';
import { Package as PackageIcon, Search } from 'lucide-react';
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
import type { MenuPackage } from '@/types';

import type { PackageTableProps } from '../../types/package-types';
import {
    formatPackagePrice,
    summarizePackagePrice,
} from '../../utils/package-price';
import { PackageCard } from './package-card';
import { buildPackageColumns } from './package-table-columns';
import { PackageTableSkeletonCells } from './package-table-skeleton';

export function PackageTable({
    appendLoadingRowCount = 0,
    canMove,
    chips,
    items,
    isLoading,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
    onPageChange,
    onPageSizeChange,
    onReorder,
    onSearchChange,
    onView,
    pageCount,
    pageIndex,
    pageSize,
    pageSizeOptions,
    searchValue,
    serverExport,
    showSearch = true,
    toolbar,
    totalItems,
    visibleItemFrom,
    visibleItemTo,
}: PackageTableProps) {
    const canReorder = Boolean(canMove && onReorder);
    const showSelectionColumn = Boolean(chips?.length);
    const showLeadingControlColumn = canReorder || showSelectionColumn;
    const shouldAppendLoadingRows = Boolean(
        isLoading && appendLoadingRowCount > 0,
    );

    return (
        <DataTable
            data={items}
            columns={buildPackageColumns({
                canMove,
                canReorder,
                onActiveChange,
                onDelete,
                onEdit,
                onMove,
                onView,
            })}
            emptyTitle="Paket Tidak Ditemukan"
            emptyDescription="Belum ada paket yang ditambahkan atau tidak ada paket yang sesuai dengan pencarian Anda."
            emptyIcon={<PackageIcon className="size-6" />}
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
            renderCard={({ row, table }) => (
                <PackageCard
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
                              showLeadingColumn={showLeadingControlColumn}
                              renderCells={(index) => (
                                  <PackageTableSkeletonCells
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
            renderToolbar={(table, context) => (
                <PackageTableHeader
                    table={table}
                    exportContext={context}
                    chips={chips}
                    isLoading={isLoading}
                    searchValue={searchValue}
                    serverExport={serverExport}
                    showSearch={showSearch}
                    toolbar={toolbar}
                    totalItems={totalItems}
                    visibleItemFrom={visibleItemFrom}
                    visibleItemTo={visibleItemTo}
                    onSearchChange={onSearchChange}
                />
            )}
            renderContent={(content) => (
                <PackageTableContent isLoading={isLoading}>
                    {content}
                </PackageTableContent>
            )}
        />
    );
}

function PackageTableHeader({
    chips,
    exportContext,
    isLoading,
    onSearchChange,
    searchValue,
    serverExport,
    showSearch,
    table,
    toolbar,
    totalItems,
    visibleItemFrom,
    visibleItemTo,
}: {
    chips?: DataTableExportChip[];
    exportContext: DataTableToolbarRenderContext;
    isLoading?: boolean;
    searchValue?: string;
    serverExport?: PackageTableProps['serverExport'];
    showSearch: boolean;
    table: TanStackTable<MenuPackage>;
    toolbar?: ReactNode;
    totalItems?: number;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
    onSearchChange?: (value: string) => void;
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
                                placeholder="Cari paket..."
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
                        <PackageIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-md truncate font-semibold tracking-normal">
                            Daftar Paket
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {packageTableSummary({
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
                    filename="paket.csv"
                    formatRow={formatPackageExportRow}
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

function PackageTableContent({
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

function packageTableSummary({
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
        return 'Memuat data paket...';
    }

    if (
        totalItems !== undefined &&
        visibleItemFrom !== undefined &&
        visibleItemTo !== undefined &&
        visibleItemFrom !== null &&
        visibleItemTo !== null
    ) {
        return `Menampilkan ${visibleItemFrom}-${visibleItemTo} dari ${totalItems} paket`;
    }

    if (totalItems !== undefined) {
        return `${totalItems} paket`;
    }

    return 'Kelola paket katalog';
}

function formatPackageExportRow(item: MenuPackage) {
    const price = summarizePackagePrice(item);

    return {
        ID: item.id ?? '',
        Paket: item.name,
        Kategori: item.package_category?.name ?? 'Tanpa kategori',
        Harga: `${price.startsFrom ? 'Mulai ' : ''}${formatPackagePrice(
            price.activePrice,
        )}`,
        'Harga Normal': formatPackagePrice(price.originalPrice),
        Promo: price.hasDiscount ? 'Ya' : 'Tidak',
        'Min. Order': item.min_order ?? 1,
        Komponen: item.items_count ?? item.items.length,
        Status: item.is_active ? 'Aktif' : 'Nonaktif',
        Rekomendasi: item.is_recommended ? 'Ya' : 'Tidak',
    };
}
