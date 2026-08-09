import { Link } from '@inertiajs/react';
import { CircleDollarSign, ExternalLink } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
    OrderPackageDetailList,
    OrderSummaryList,
    OrderSummaryTotals,
} from '@/components/shared/order-summaries';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderCustomerSummaryView } from '@/features/orders/components/form/order-customer-summary';
import { cn } from '@/lib/utils';
import orderRoute from '@/routes/order';

import type {
    ReportOrder,
    ReportOrderItem,
    ReportOrderPayment,
} from '../../types/report-types';
import {
    formatReportDate,
    formatReportDateTime,
    formatReportPrice,
} from '../../utils/report-utils';

export function ReportOrderCard({ order }: { order: ReportOrder }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                className={cn(
                    'group relative flex w-full items-center gap-4 rounded-lg px-3 py-3 text-left',
                    'transition-colors hover:bg-muted/30',
                )}
                onClick={() => setOpen(true)}
            >
                {/* Left: Status dot */}
                <span
                    className={cn(
                        'size-2 shrink-0 rounded-full',
                        order.payment_status === 'paid'
                            ? 'bg-emerald-400'
                            : 'bg-amber-400',
                    )}
                />

                {/* Order code + payment badge */}
                <div className="flex min-w-0 flex-[2] items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground/85 group-hover:text-foreground">
                        {order.order_code}
                    </span>
                </div>

                {/* Customer */}
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground/70">
                    {order.customer_name}
                </span>

                {/* Event name */}
                <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground/60 lg:block">
                    {order.event_name || '-'}
                </span>

                {/* Date */}
                <span className="hidden text-xs text-muted-foreground/50 tabular-nums sm:block">
                    {formatReportDate(order.event_date)}
                </span>

                {/* Total */}
                <span className="shrink-0 text-xs font-bold text-foreground/80 tabular-nums group-hover:text-foreground">
                    {formatReportPrice(order.total_price)}
                </span>

                {/* Arrow indicator */}
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground/25 transition-colors group-hover:text-muted-foreground/60" />
            </button>

            <OrderSummaryDrawer
                open={open}
                order={order}
                onOpenChange={setOpen}
            />
        </>
    );
}

function ChevronRightIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}

function OrderSummaryDrawer({
    open,
    order,
    onOpenChange,
}: {
    open: boolean;
    order: ReportOrder;
    onOpenChange: (open: boolean) => void;
}) {
    const summaryItems = useMemo<OrderSummaryItemData[]>(
        () => orderSummaryItems(order.items),
        [order.items],
    );

    return (
        <Drawer open={open} swipeDirection="right" onOpenChange={onOpenChange}>
            <DrawerContent className="m-0 h-dvh max-h-dvh max-w-none rounded-none border-y-0 border-r-0 [--drawer-content-width:min(100vw,40rem)] [--drawer-inset:0px] sm:m-2 sm:h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-1rem)] sm:rounded-3xl sm:border sm:[--drawer-inset:--spacing(2)]">
                <DrawerHeader className="border-b px-5 py-4 sm:px-6 sm:py-5">
                    <DrawerTitle className="truncate text-base font-semibold">
                        Ringkasan Order
                    </DrawerTitle>
                    <DrawerDescription className="truncate text-xs text-muted-foreground">
                        {order.order_code}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
                    <div className="mx-auto max-w-md">
                        {/* Customer info - always visible at top */}
                        <div className="mb-4">
                            <OrderCustomerSummaryView
                                values={{
                                    address_name: order.address_name,
                                    customer_name: order.customer_name,
                                    event_address: order.event_address,
                                    event_date: order.event_date,
                                    event_name: order.event_name,
                                    event_time: order.event_time,
                                    latitude: order.latitude,
                                    longitude: order.longitude,
                                    notes: order.notes,
                                    phone: order.phone,
                                }}
                            />
                            <div className="mt-4 border-t border-border/60" />
                        </div>

                        <Tabs defaultValue="items" className="gap-4">
                            <TabsList
                                variant="line"
                                className="w-full justify-start gap-5 border-b border-border/70 p-0 group-data-[orientation=horizontal]/tabs:h-10"
                            >
                                <TabsTrigger
                                    value="items"
                                    className="h-10 flex-none rounded-none px-0 text-xs group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                                >
                                    Item Order
                                </TabsTrigger>
                                <TabsTrigger
                                    value="payments"
                                    className="h-10 flex-none rounded-none px-0 text-xs group-data-[orientation=horizontal]/tabs:after:bottom-[-1px]"
                                >
                                    Pembayaran
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="items">
                                {summaryItems.length > 0 ? (
                                    <div className="grid gap-3 pt-1">
                                        <OrderSummaryList
                                            items={summaryItems}
                                            variant="compact"
                                        />
                                        <OrderSummaryTotals
                                            itemCount={order.items_count}
                                            subtotal={formatReportPrice(
                                                order.subtotal,
                                            )}
                                            total={formatReportPrice(
                                                order.total_price,
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                                        Belum ada item order.
                                    </p>
                                )}
                            </TabsContent>

                            <TabsContent value="payments">
                                <div className="space-y-4 pt-1">
                                    {order.payments.length > 0 ? (
                                        <div className="overflow-hidden rounded-lg bg-muted/20">
                                            <div className="divide-y divide-border/60">
                                                {order.payments.map(
                                                    (payment) => (
                                                        <ExistingPaymentRow
                                                            key={payment.id}
                                                            payment={payment}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                                            Belum ada pembayaran.
                                        </p>
                                    )}

                                    <div className="grid gap-2.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                Total Tagihan
                                            </span>
                                            <span className="text-sm font-semibold text-foreground tabular-nums">
                                                {formatReportPrice(
                                                    order.total_price,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                Telah Dibayar
                                            </span>
                                            <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                                                -
                                                {formatReportPrice(
                                                    order.paid_amount,
                                                )}
                                            </span>
                                        </div>
                                        <div className="border-t border-border/30 pt-2.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-foreground">
                                                    Sisa Tagihan
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-base font-bold tabular-nums',
                                                        order.remaining_amount >
                                                            0
                                                            ? 'text-amber-600 dark:text-amber-400'
                                                            : 'text-emerald-600 dark:text-emerald-400',
                                                    )}
                                                >
                                                    {formatReportPrice(
                                                        order.remaining_amount,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DrawerFooter className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
                    <Button type="button" className="w-full gap-2" asChild>
                        <Link href={orderRoute.show.url(order.id)}>
                            <ExternalLink className="size-4" />
                            Lihat Detail Order
                        </Link>
                    </Button>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function ExistingPaymentRow({ payment }: { payment: ReportOrderPayment }) {
    return (
        <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
            {payment.proof_image ? (
                <a
                    href={payment.proof_image}
                    target="_blank"
                    rel="noreferrer"
                    className="size-11 shrink-0 overflow-hidden rounded-md border bg-background"
                    title="Lihat bukti pembayaran"
                >
                    <img
                        src={payment.proof_image}
                        alt="Bukti pembayaran"
                        className="size-full object-cover"
                    />
                </a>
            ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
                    <CircleDollarSign className="size-4" />
                </span>
            )}

            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                    {paymentTypeLabel(payment)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {paymentMethodLabel(payment.method)} ·{' '}
                    {payment.paid_at
                        ? formatReportDateTime(payment.paid_at)
                        : '-'}
                </p>
            </div>

            <div className="col-start-2 flex items-center justify-end gap-2 sm:col-start-auto">
                <span className="text-sm font-semibold whitespace-nowrap tabular-nums">
                    {formatReportPrice(payment.amount)}
                </span>
            </div>
        </div>
    );
}

function paymentTypeLabel(payment: ReportOrderPayment): string {
    if (payment.type === 'dp') {
        return 'Pembayaran DP';
    }

    if (payment.type === 'remaining') {
        return 'Pelunasan';
    }

    return 'Pembayaran lunas';
}

function paymentMethodLabel(method: string | null): string {
    if (method === 'transfer') {
        return 'Transfer';
    }

    if (method === 'cash') {
        return 'Tunai';
    }

    return 'Manual';
}

function orderSummaryItems(items: ReportOrderItem[]): OrderSummaryItemData[] {
    return items.map((item) => {
        const sourceItem =
            item.item_type === 'package' ? item.package : item.menu_item;
        const categoryName =
            item.item_type === 'package'
                ? item.package?.package_category?.name
                : item.menu_item?.menu_category?.name;

        return {
            details:
                item.item_type === 'package' &&
                item.selected_items &&
                item.package
                    ? {
                          content: (
                              <OrderPackageDetailList
                                  items={item.selected_items.map(
                                      (selectedItem) => ({
                                          id:
                                              selectedItem.package_item_id ??
                                              selectedItem.menu_item_id ??
                                              '0',
                                          image:
                                              selectedItem.primary_image ??
                                              null,
                                          name:
                                              selectedItem.name ??
                                              'Menu tidak tersedia',
                                          price:
                                              selectedItem.price &&
                                              selectedItem.price > 0
                                                  ? formatReportPrice(
                                                        selectedItem.price,
                                                    )
                                                  : 'Termasuk',
                                      }),
                                  )}
                              />
                          ),
                          label: `Tampilkan detail ${item.name_snapshot}`,
                      }
                    : undefined,
            id: `order-item-${item.id}`,
            image: sourceItem?.primary_image,
            imageAlt: item.name_snapshot,
            meta:
                categoryName ||
                (item.item_type === 'package' ? 'Paket' : 'Menu'),
            name: item.name_snapshot,
            quantity: String(item.qty ?? 1),
            total: formatReportPrice(item.subtotal),
            unitPrice: formatReportPrice(item.price_snapshot),
        };
    });
}
