import { Head, router } from '@inertiajs/react';
import { Banknote, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import type { DataTableExportChip } from '@/components/data-table';
import { MetricCard } from '@/components/shared/metric-card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { OrderTable } from '@/features/orders/components/table/order-table';
import { OrderTableToolbar } from '@/features/orders/components/table/order-table-toolbar';
import { useOrderTable } from '@/features/orders/hooks/use-order-table';
import type { OrderIndexProps } from '@/features/orders/types/order-types';
import {
    orderPaymentStatusLabels,
    orderPaymentTypeLabels,
    orderStatusLabels,
} from '@/features/orders/utils/order-format';
import {
    buildOrderIndexQuery,
    defaultOrderIndexFilters,
    defaultOrderIndexItems,
    defaultOrderIndexStats,
} from '@/features/orders/utils/order-index';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';
import type { Order } from '@/types';

const numberFormatter = new Intl.NumberFormat('id-ID');
const emptyActivityItems: NonNullable<OrderIndexProps['activityItems']> = [];

export default function OrderIndexPage(props: OrderIndexProps) {
    const activityItems = props.activityItems ?? emptyActivityItems;
    const filters = props.filters ?? defaultOrderIndexFilters;
    const items = props.items ?? defaultOrderIndexItems;
    const stats = props.stats ?? defaultOrderIndexStats;
    const {
        deleteTarget,
        displayFilters,
        handleDeleteConfirm,
        handleDeleteRequest,
        handleStatusChange,
        isLoading,
        prefetchIndex,
        search,
        setDeleteTarget,
        setSearch,
        visitIndex,
    } = useOrderTable({
        activityItems,
        filters,
        items,
        stats,
    });

    const handlePageChange = useCallback(
        (pageIndex: number) => {
            visitIndex({ page: pageIndex + 1 });
        },
        [visitIndex],
    );

    const handlePageSizeChange = useCallback(
        (pageSize: number) => {
            visitIndex({ page: 1, perPage: pageSize });
        },
        [visitIndex],
    );

    const exportChips = useMemo<DataTableExportChip[]>(() => {
        const chips: DataTableExportChip[] = [];

        if (displayFilters.status !== 'all') {
            chips.push({
                id: 'status',
                label: 'Status',
                value: orderStatusLabels[displayFilters.status],
                onRemove: () => visitIndex({ page: 1, status: 'all' }),
            });
        }

        if (displayFilters.payment_status !== 'all') {
            chips.push({
                id: 'payment_status',
                label: 'Pembayaran',
                value: orderPaymentStatusLabels[displayFilters.payment_status],
                onRemove: () => visitIndex({ page: 1, paymentStatus: 'all' }),
            });
        }

        if (displayFilters.payment_type !== 'all') {
            chips.push({
                id: 'payment_type',
                label: 'Tipe',
                value: orderPaymentTypeLabels[displayFilters.payment_type],
                onRemove: () => visitIndex({ page: 1, paymentType: 'all' }),
            });
        }

        if (displayFilters.event_date_from) {
            chips.push({
                id: 'event_date_from',
                label: 'Dari',
                value: displayFilters.event_date_from,
                onRemove: () => visitIndex({ eventDateFrom: null, page: 1 }),
            });
        }

        if (displayFilters.event_date_to) {
            chips.push({
                id: 'event_date_to',
                label: 'Sampai',
                value: displayFilters.event_date_to,
                onRemove: () => visitIndex({ eventDateTo: null, page: 1 }),
            });
        }

        if (search) {
            chips.push({
                id: 'search',
                label: 'Pencarian',
                value: search,
                onRemove: () => setSearch(''),
            });
        }

        return chips;
    }, [displayFilters, search, setSearch, visitIndex]);
    const exportQuery = useMemo(
        () =>
            buildOrderIndexQuery({
                eventDateFrom: displayFilters.event_date_from,
                eventDateTo: displayFilters.event_date_to,
                page: 1,
                paymentStatus: displayFilters.payment_status,
                paymentType: displayFilters.payment_type,
                perPage: displayFilters.per_page,
                search,
                sortBy: displayFilters.sort_by,
                sortDir: displayFilters.sort_dir,
                status: displayFilters.status,
            }),
        [displayFilters, search],
    );

    return (
        <>
            <Head title="Order" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-5 lg:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <OrderTableToolbar
                        filters={displayFilters}
                        search={search}
                        onFilterChange={visitIndex}
                        onFilterPrefetch={prefetchIndex}
                        onSearchChange={setSearch}
                    />

                    <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                        <MetricCard
                            description="Order baru yang masih menunggu tindakan admin."
                            icon={Clock3}
                            label="Menunggu ACC"
                            tone="amber"
                            value={numberFormatter.format(
                                stats.pending_confirmation,
                            )}
                        />
                        <MetricCard
                            description="Order dengan DP tercatat dan sisa pembayaran berjalan."
                            icon={Banknote}
                            label="DP Dibayar"
                            tone="sky"
                            value={numberFormatter.format(stats.dp_paid)}
                        />
                        <MetricCard
                            description="Order yang pembayaran akhirnya sudah lunas."
                            icon={CheckCircle2}
                            label="Lunas"
                            tone="emerald"
                            value={numberFormatter.format(stats.paid)}
                        />
                        <MetricCard
                            description="Order yang sudah dibatalkan."
                            icon={XCircle}
                            label="Dibatalkan"
                            tone="rose"
                            value={numberFormatter.format(stats.canceled)}
                        />
                    </section>

                    <OrderTable
                        items={items.data}
                        isLoading={isLoading}
                        onDelete={handleDeleteRequest}
                        onEdit={(item: Order) =>
                            router.visit(orderRoute.edit(item.id))
                        }
                        onPageChange={handlePageChange}
                        onPageSizeChange={handlePageSizeChange}
                        onSearchChange={setSearch}
                        onStatusChange={handleStatusChange}
                        onView={(item: Order) =>
                            router.visit(orderRoute.show(item.id))
                        }
                        pageCount={items.last_page}
                        pageIndex={items.current_page - 1}
                        pageSize={displayFilters.per_page}
                        pageSizeOptions={displayFilters.per_page_options}
                        searchValue={search}
                        serverExport={{
                            url: orderRoute.export.url(),
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
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia>
                            <XCircle className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Hapus order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Order {deleteTarget?.order_code ?? ''} akan dihapus
                            permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => setDeleteTarget(null)}
                        >
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

OrderIndexPage.layout = {
    title: 'Order',
    description: 'Kelola order pelanggan, status acara, dan pembayaran.',
    action: {
        label: 'Tambah',
        href: orderRoute.create(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Order',
            href: orderRoute.index(),
        },
    ],
};
