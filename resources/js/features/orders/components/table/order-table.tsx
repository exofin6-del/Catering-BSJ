import type { Table as TanStackTable } from '@tanstack/react-table';
import { ReceiptText, Search } from 'lucide-react';
import { useState } from 'react';
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
import type { Order } from '@/types';

import type { OrderTableProps } from '../../types/order-types';
import {
    formatOrderPrice,
    formatOrderTime,
    orderPaymentStatusLabels,
    orderPaymentTypeLabels,
    orderStatusLabels,
} from '../../utils/order-format';
import { OrderCard } from './order-card';
import { OrderQuickActionDialog } from './order-quick-action-dialog';
import type { OrderQuickActionDialogState } from './order-quick-action-dialog';
import { OrderReceiptDrawer } from './order-receipt-drawer';
import { buildOrderColumns } from './order-table-columns';
import { OrderTableSkeletonCells } from './order-table-skeleton';

export function OrderTable({
    appendLoadingRowCount = 0,
    chips,
    items,
    isLoading,
    onDelete,
    onEdit,
    onPageChange,
    onPageSizeChange,
    onSearchChange,
    onStatusChange,
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
}: OrderTableProps) {
    const [quickAction, setQuickAction] =
        useState<OrderQuickActionDialogState | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
    const showSelectionColumn = Boolean(chips?.length);
    const shouldAppendLoadingRows = Boolean(
        isLoading && appendLoadingRowCount > 0,
    );

    return (
        <>
            <DataTable
                data={items}
                columns={buildOrderColumns({
                    onDelete,
                    onEdit,
                    onOpenQuickAction: setQuickAction,
                    onReceipt: setReceiptOrder,
                    onStatusChange,
                    onView,
                })}
                emptyTitle="Order Tidak Ditemukan"
                emptyDescription="Belum ada order yang masuk atau tidak ada order yang sesuai dengan filter."
                emptyIcon={<ReceiptText className="size-6" />}
                getRowId={(item) => String(item.id)}
                manualPagination={pageCount !== undefined}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                pageCount={pageCount}
                pageIndex={pageIndex}
                rowCount={totalItems}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                className="gap-3"
                cardListClassName="w-full max-w-full gap-0"
                tableWrapperClassName="rounded-md"
                renderCard={({ row }) => (
                    <OrderCard
                        item={row.original}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onOpenQuickAction={setQuickAction}
                        onReceipt={setReceiptOrder}
                        onStatusChange={onStatusChange}
                        onView={onView}
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
                                  showLeadingColumn={showSelectionColumn}
                                  renderCells={(index) => (
                                      <OrderTableSkeletonCells
                                          index={index}
                                          showLeadingColumn={
                                              showSelectionColumn
                                          }
                                      />
                                  )}
                              />
                          )
                        : undefined
                }
                renderToolbar={(table, context) => (
                    <OrderTableHeader
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
                    <OrderTableContent isLoading={isLoading}>
                        {content}
                    </OrderTableContent>
                )}
            />

            {quickAction ? (
                <OrderQuickActionDialog
                    key={`${quickAction.kind}-${quickAction.order.id}`}
                    action={quickAction}
                    onOpenChange={(open) => {
                        if (!open) {
                            setQuickAction(null);
                        }
                    }}
                    onStatusConfirm={(order, status) =>
                        onStatusChange?.(order, status)
                    }
                />
            ) : null}

            {receiptOrder ? (
                <OrderReceiptDrawer
                    key={receiptOrder.id}
                    open
                    order={receiptOrder}
                    onOpenChange={(open) => {
                        if (!open) {
                            setReceiptOrder(null);
                        }
                    }}
                />
            ) : null}
        </>
    );
}

function OrderTableHeader({
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
    serverExport?: OrderTableProps['serverExport'];
    showSearch: boolean;
    table: TanStackTable<Order>;
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
                                placeholder="Cari order..."
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
                        <ReceiptText className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-md truncate font-semibold tracking-normal">
                            Daftar Order
                        </h2>
                        <p className="truncate text-xs text-muted-foreground">
                            {orderTableSummary({
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
                    filename="order.csv"
                    formatRow={formatOrderExportRow}
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

function OrderTableContent({
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

function orderTableSummary({
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
        return 'Memuat data order...';
    }

    if (
        totalItems !== undefined &&
        visibleItemFrom !== undefined &&
        visibleItemTo !== undefined &&
        visibleItemFrom !== null &&
        visibleItemTo !== null
    ) {
        return `Menampilkan ${visibleItemFrom}-${visibleItemTo} dari ${totalItems} order`;
    }

    if (totalItems !== undefined) {
        return `${totalItems} order`;
    }

    return 'Kelola order pelanggan';
}

function formatOrderExportRow(item: Order) {
    return {
        ID: item.id,
        Kode: item.order_code,
        Pelanggan: item.customer_name,
        Telepon: item.phone,
        Acara: item.event_name,
        Tanggal: item.event_date,
        Jam: formatOrderTime(item.event_time),
        Total: formatOrderPrice(item.total_price),
        Pembayaran: orderPaymentStatusLabels[item.payment_status],
        'Tipe Pembayaran': orderPaymentTypeLabels[item.payment_type],
        Status: orderStatusLabels[item.status],
    };
}
