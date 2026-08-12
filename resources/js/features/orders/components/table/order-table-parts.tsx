import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    Eye,
    MoreVertical,
    Pencil,
    ReceiptText,
    Trash2,
    UserRound,
    XCircle,
} from 'lucide-react';

import {
    DataTableDetailEditQuickActionButtons,
    DataTableQuickActions,
} from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import orderRoute from '@/routes/order';
import type { Order } from '@/types';

import type { OrderTableProps } from '../../types/order-types';
import {
    formatOrderDate,
    formatOrderPrice,
    formatOrderTime,
    numberValue,
    orderPaymentStatusLabels,
    orderStatusBadgeClass,
    orderStatusLabels,
    orderPaidAmount,
} from '../../utils/order-format';
import type { OrderQuickActionDialogState } from './order-quick-action-dialog';
import {
    canCancelOrder,
    canCompleteOrder,
    canConfirmOrder,
    canSettleOrder,
    canViewOrderReceipt,
    getSettleButtonLabel,
    getSettleHref,
    OrderQuickActionButton,
} from './order-table-actions';

export type OrderTableActions = Pick<
    OrderTableProps,
    'onDelete' | 'onEdit' | 'onStatusChange' | 'onView'
> & {
    onOpenQuickAction?: (action: OrderQuickActionDialogState) => void;
    onReceipt?: (item: Order) => void;
};

export function OrderName({
    item,
    compact = false,
}: {
    item: Order;
    compact?: boolean;
}) {
    return (
        <div className="grid min-w-0 gap-2 text-left whitespace-normal">
            <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                <span className="shrink-0 leading-snug font-semibold text-foreground uppercase tabular-nums">
                    {item.order_code}
                </span>

                <OrderStatusPill item={item} onlyDot={compact} />
            </div>
            <div className="grid min-w-0 gap-1 text-xs leading-snug text-muted-foreground">
                <span className="break-words">
                    <span className="mr-1 font-medium text-foreground">
                        {item.customer_name}
                    </span>
                </span>
                <span className="break-words md:hidden">{item.event_name}</span>
            </div>
        </div>
    );
}

export function OrderSchedule({ item }: { item: Order }) {
    return (
        <div className="grid min-w-0 gap-0.5">
            <OrderEventName item={item} />
            <OrderDateTime item={item} />
        </div>
    );
}

function OrderEventName({ item }: { item: Order }) {
    return (
        <span
            className="truncate text-sm leading-snug font-medium whitespace-nowrap text-foreground"
            title={item.event_name}
        >
            {item.event_name}
        </span>
    );
}

export function OrderDateTime({ item }: { item: Order }) {
    return (
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                <CalendarDays className="size-3.5 shrink-0 opacity-60" />
                {formatOrderDate(item.event_date)}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap md:border-l md:border-border/60 md:pl-2">
                <Clock className="size-3.5 opacity-60" />
                {formatOrderTime(item.event_time)}
            </span>
        </div>
    );
}

export function OrderStatusBadge({ item }: { item: Order }) {
    return (
        <Badge
            variant="outline"
            className={cn(orderStatusBadgeClass(item.status))}
        >
            {orderStatusLabels[item.status]}
        </Badge>
    );
}

export function OrderPayment({ item }: { item: Order }) {
    return (
        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
            <OrderPaymentPill item={item} />
        </div>
    );
}

export function OrderOrigin({
    item,
    variant = 'horizontal',
}: {
    item: Order;
    variant?: 'horizontal' | 'vertical';
}) {
    const isAdmin = item.created_by_admin;
    const label = isAdmin ? 'Admin' : 'Customer';
    const description = isAdmin ? 'Manual' : 'Web';

    if (variant === 'vertical') {
        return (
            <div
                className="flex items-center justify-end gap-2 whitespace-nowrap"
                title={item.created_by_admin?.name || `${label} ${description}`}
            >
                <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-md ${isAdmin ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'}`}
                >
                    <UserRound className="size-3.5" />
                </span>
                <span className="grid min-w-0 gap-0.5 leading-none">
                    <span className="text-sm font-medium whitespace-nowrap text-foreground">
                        {label}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                        {description}
                    </span>
                </span>
            </div>
        );
    }

    return (
        <span
            className="inline-flex items-center gap-1.5 whitespace-nowrap"
            title={item.created_by_admin?.name || `${label} ${description}`}
        >
            <span
                className={`inline-flex size-4 items-center justify-center rounded-[4px] ${isAdmin ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'}`}
            >
                <UserRound className="size-2.5" />
            </span>
            <span className="text-[13px] font-medium text-muted-foreground">
                {label} {description}
            </span>
        </span>
    );
}

export function OrderStatusPill({
    item,
    onlyDot = false,
}: {
    item: Order;
    onlyDot?: boolean;
}) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center justify-center font-semibold uppercase shadow-none ring-0',
                onlyDot
                    ? 'size-5 rounded-full border-0 p-0 text-[10px]'
                    : 'rounded-md border-0 px-1.5 py-0.5 text-[10px] leading-none',
                orderStatusBadgeClass(item.status),
            )}
            title={orderStatusLabels[item.status]}
        >
            <span
                className={cn(
                    'rounded-full bg-current opacity-70',
                    onlyDot ? 'size-2' : 'mr-1 size-1',
                )}
            />
            {!onlyDot && orderStatusLabels[item.status]}
        </span>
    );
}

function OrderPaymentPill({ item }: { item: Order }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] leading-none font-semibold whitespace-nowrap uppercase tabular-nums',
                paymentStatusTextClass(item),
            )}
            title={orderPaymentStatusLabels[item.payment_status]}
        >
            <span>{orderPaymentTableLabel(item)}</span>
        </span>
    );
}

function paymentStatusTextClass(item: Order): string {
    if (item.payment_status === 'paid') {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (item.payment_status === 'dp_paid') {
        return 'text-sky-600 dark:text-sky-400';
    }

    return 'text-zinc-500 dark:text-zinc-400';
}

function orderPaymentTableLabel(item: Order): string {
    if (item.payment_status === 'paid') {
        return 'Lunas';
    }

    if (item.payment_status === 'dp_paid') {
        const paidAmount = Math.max(
            orderPaidAmount(item),
            numberValue(item.dp_amount),
        );
        const totalAmount = numberValue(item.total_price);
        const percentage =
            totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

        return `DP ${percentage}% | ${formatOrderPrice(paidAmount)}`;
    }

    return 'Belum Bayar';
}

export function OrderActions({
    item,
    onDelete,
    onOpenQuickAction,
    onReceipt,
    onStatusChange,
}: OrderTableActions & { item: Order }) {
    const canCancel = canCancelOrder(item, Boolean(onStatusChange));
    const canConfirm = canConfirmOrder(item, Boolean(onStatusChange));
    const canDelete = item.status === 'canceled' && Boolean(onDelete);
    const canEdit = Boolean(item.can_edit);
    const canComplete = canCompleteOrder(item, Boolean(onStatusChange));
    const canSettle = canSettleOrder(item);
    const canViewReceipt = canViewOrderReceipt(item);
    const paymentHref = getSettleHref(item);

    return (
        <div className="flex items-center justify-end gap-1.5">
            <DataTableQuickActions>
                <DataTableDetailEditQuickActionButtons
                    editHref={canEdit ? orderRoute.edit(item.id) : undefined}
                    item={item}
                    viewHref={orderRoute.show(item.id)}
                />
                {canConfirm ? (
                    <OrderQuickActionButton
                        compact
                        icon={<CheckCircle className="size-3.5" />}
                        href={orderRoute.acceptPage(item.id)}
                        label="ACC"
                        tone="success"
                    />
                ) : null}
                {canComplete ? (
                    <OrderQuickActionButton
                        compact
                        icon={<CheckCircle2 className="size-3.5" />}
                        label="Selesai"
                        tone="success"
                        onClick={() =>
                            onOpenQuickAction?.({
                                kind: 'complete',
                                order: item,
                            })
                        }
                    />
                ) : null}
                {canSettle ? (
                    <OrderQuickActionButton
                        compact
                        icon={<CircleDollarSign className="size-3.5" />}
                        href={paymentHref}
                        label={getSettleButtonLabel(item)}
                    />
                ) : null}
                {canCancel ? (
                    <OrderQuickActionButton
                        compact
                        icon={<XCircle className="size-3.5" />}
                        label="Batal"
                        tone="destructive"
                        onClick={() =>
                            onOpenQuickAction?.({
                                kind: 'cancel',
                                order: item,
                            })
                        }
                    />
                ) : null}
                {canViewReceipt ? (
                    <OrderQuickActionButton
                        compact
                        icon={<ReceiptText className="size-3.5" />}
                        label="Struk"
                        onClick={() => onReceipt?.(item)}
                    />
                ) : null}
            </DataTableQuickActions>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="flex size-8 shrink-0 appearance-none items-center justify-center border-none bg-transparent p-0 text-muted-foreground shadow-none ring-0 outline-none hover:text-foreground focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none data-[state=open]:bg-transparent"
                    >
                        <MoreVertical className="size-5" />
                        <span className="sr-only">Buka aksi order</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    {canCancel || canConfirm ? (
                        <DropdownMenuGroup>
                            {canCancel ? (
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() =>
                                        onOpenQuickAction?.({
                                            kind: 'cancel',
                                            order: item,
                                        })
                                    }
                                >
                                    <XCircle className="size-4" />
                                    Batalkan
                                </DropdownMenuItem>
                            ) : null}
                            {canConfirm ? (
                                <DropdownMenuItem asChild>
                                    <Link href={orderRoute.acceptPage(item.id)}>
                                        <CheckCircle className="size-4" />
                                        ACC Order
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuGroup>
                    ) : null}

                    {(canCancel || canConfirm) &&
                    (canViewReceipt || canComplete || canSettle) ? (
                        <DropdownMenuSeparator />
                    ) : null}

                    {canViewReceipt || canComplete || canSettle ? (
                        <DropdownMenuGroup>
                            {canViewReceipt ? (
                                <DropdownMenuItem
                                    onSelect={() => onReceipt?.(item)}
                                >
                                    <ReceiptText className="size-4" />
                                    Struk
                                </DropdownMenuItem>
                            ) : null}
                            {canComplete ? (
                                <DropdownMenuItem
                                    onSelect={() =>
                                        onOpenQuickAction?.({
                                            kind: 'complete',
                                            order: item,
                                        })
                                    }
                                >
                                    <CheckCircle2 className="size-4" />
                                    Selesai
                                </DropdownMenuItem>
                            ) : null}
                            {canSettle ? (
                                <DropdownMenuItem asChild>
                                    <Link href={getSettleHref(item)}>
                                        <CircleDollarSign className="size-4" />
                                        {getSettleButtonLabel(item)}
                                    </Link>
                                </DropdownMenuItem>
                            ) : null}
                        </DropdownMenuGroup>
                    ) : null}

                    {canCancel ||
                    canConfirm ||
                    canViewReceipt ||
                    canComplete ||
                    canSettle ? (
                        <DropdownMenuSeparator />
                    ) : null}

                    <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                            <Link href={orderRoute.show(item.id)}>
                                <Eye className="size-4" />
                                Detail
                            </Link>
                        </DropdownMenuItem>
                        {canEdit ? (
                            <DropdownMenuItem asChild>
                                <Link href={orderRoute.edit(item.id)}>
                                    <Pencil className="size-4" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                        ) : null}
                    </DropdownMenuGroup>

                    {canDelete ? (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuItem
                                    variant="destructive"
                                    onSelect={() => onDelete?.(item)}
                                >
                                    <Trash2 className="size-4" />
                                    Hapus
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </>
                    ) : null}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
