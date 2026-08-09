import type { Order } from '@/types';

import {
    OrderActions,
    OrderDateTime,
    OrderOrigin,
    OrderPayment,
    OrderStatusPill,
} from './order-table-parts';
import type { OrderTableActions } from './order-table-parts';

export function OrderCard({
    item,
    onDelete,
    onEdit,
    onOpenQuickAction,
    onReceipt,
    onStatusChange,
    onView,
}: OrderTableActions & {
    item: Order;
}) {
    return (
        <article className="flex min-w-0 items-stretch gap-3 border-b py-4 last:border-b-0">
            {/* Konten kiri: grid 2 kolom agar badge & tanggal sejajar vertikal */}
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5">
                {/* Baris 1 kiri: kode */}
                <div className="flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0 leading-snug font-semibold text-foreground uppercase tabular-nums">
                        {item.order_code}
                    </span>
                </div>

                {/* Baris 1 kanan: dot status + badge pembayaran */}
                <div className="flex items-center justify-end gap-1.5">
                    <OrderStatusPill item={item} onlyDot />
                    <OrderPayment item={item} />
                </div>

                {/* Baris 2: customer + origin (full width) */}
                <span className="min-w-0 truncate text-sm leading-snug font-medium text-foreground">
                    {item.customer_name}
                </span>
                <div className="flex items-center justify-end">
                    <OrderOrigin item={item} />
                </div>

                {/* Baris 3 kiri: nama acara */}
                <span className="min-w-0 truncate text-xs leading-snug text-foreground">
                    {item.event_name}
                </span>
                {/* Baris 3 kanan: tanggal/jam — sejajar dengan badge bayar */}
                <OrderDateTime item={item} />
            </div>

            {/* Actions kanan */}
            <div className="flex shrink-0 items-center justify-center border-l pl-1">
                <OrderActions
                    item={item}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onOpenQuickAction={onOpenQuickAction}
                    onReceipt={onReceipt}
                    onStatusChange={onStatusChange}
                    onView={onView}
                />
            </div>
        </article>
    );
}
