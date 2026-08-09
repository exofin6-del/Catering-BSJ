import type { ColumnDef } from '@tanstack/react-table';

import type { Order } from '@/types';

import {
    OrderActions,
    OrderName,
    OrderOrigin,
    OrderPayment,
    OrderSchedule,
} from './order-table-parts';
import type { OrderTableActions } from './order-table-parts';

export function buildOrderColumns({
    onDelete,
    onEdit,
    onOpenQuickAction,
    onReceipt,
    onStatusChange,
    onView,
}: OrderTableActions): ColumnDef<Order>[] {
    return [
        {
            accessorKey: 'order_code',
            cell: ({ row }) => (
                <div className="w-[18rem] max-w-[35vw] min-w-[14rem] py-1 whitespace-normal">
                    <OrderName item={row.original} />
                </div>
            ),
            enableHiding: false,
            header: () => (
                <span className="block w-[18rem] max-w-[35vw] min-w-[14rem] text-left">
                    Order
                </span>
            ),
        },
        {
            accessorKey: 'event_date',
            cell: ({ row }) => (
                <div className="w-[20rem] max-w-[40vw] min-w-[16rem] py-1 whitespace-normal">
                    <OrderSchedule item={row.original} />
                </div>
            ),
            header: () => (
                <span className="block w-[20rem] max-w-[40vw] min-w-[16rem] text-left">
                    Acara
                </span>
            ),
        },
        {
            accessorKey: 'created_by_admin',
            cell: ({ row }) => (
                <div className="flex min-w-[6.5rem] justify-center px-3 py-1">
                    <OrderOrigin item={row.original} variant="vertical" />
                </div>
            ),
            header: () => (
                <span className="block min-w-[6.5rem] px-3 text-center">
                    Sumber
                </span>
            ),
        },
        {
            accessorKey: 'payment_status',
            cell: ({ row }) => (
                <div className="flex min-w-[8.5rem] justify-center px-3 py-1">
                    <OrderPayment item={row.original} />
                </div>
            ),
            header: () => (
                <span className="block min-w-[8.5rem] px-3 text-center">
                    Pembayaran
                </span>
            ),
        },

        {
            cell: ({ row }) => (
                <div className="min-w-[8rem] py-1">
                    <OrderActions
                        item={row.original}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onOpenQuickAction={onOpenQuickAction}
                        onReceipt={onReceipt}
                        onStatusChange={onStatusChange}
                        onView={onView}
                    />
                </div>
            ),
            enableHiding: false,
            enableSorting: false,
            id: 'actions',
        },
    ];
}
