import { ChevronLeft } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { OrderCustomerSummaryView } from '@/features/orders/components/form/order-customer-summary';
import {
    OrderFormSummaryAside,
    orderSnapshotSummary,
    orderSnapshotSummaryItems,
} from '@/features/orders/components/form/order-form-summary-aside';
import { cn } from '@/lib/utils';
import type { Order } from '@/types';

import type { ScheduleItem } from '../types/schedule-types';
import { formatSchedulePrice } from '../utils/schedule-format';

type ScheduleDetailDrawerProps = {
    activeOrder: ScheduleItem | null;
    orderForSummary: Order | null;
    onOpenChange: (open: boolean) => void;
};

export function ScheduleDetailDrawer({
    activeOrder,
    orderForSummary,
    onOpenChange,
}: ScheduleDetailDrawerProps) {
    return (
        <Drawer
            open={!!activeOrder}
            onOpenChange={onOpenChange}
            swipeDirection="right"
        >
            {activeOrder ? (
                <DrawerContent className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[24rem] max-sm:m-0 max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:[--drawer-inset:0px] sm:w-[24rem]">
                    <DrawerHeader className="shrink-0 border-b p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <DrawerClose
                                    type="button"
                                    aria-label="Kembali"
                                    className={buttonVariants({
                                        variant: 'ghost',
                                        size: 'icon',
                                        className:
                                            '-ml-2 size-9 shrink-0 hover:bg-transparent sm:hidden',
                                    })}
                                >
                                    <ChevronLeft className="size-7" />
                                </DrawerClose>

                                <DrawerTitle className="truncate text-lg font-semibold">
                                    {activeOrder.event_name}
                                </DrawerTitle>
                                <DrawerDescription className="mt-1 flex min-w-0 items-center gap-2">
                                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                                        {activeOrder.order_code}
                                    </span>
                                </DrawerDescription>
                            </div>
                            <Badge
                                variant={
                                    activeOrder.payment_status === 'paid'
                                        ? 'default'
                                        : activeOrder.payment_status ===
                                            'dp_paid'
                                          ? 'secondary'
                                          : 'outline'
                                }
                                className="shrink-0"
                            >
                                {activeOrder.payment_status === 'paid'
                                    ? 'Lunas'
                                    : activeOrder.payment_status === 'dp_paid'
                                      ? 'DP'
                                      : 'Belum bayar'}
                            </Badge>
                        </div>
                    </DrawerHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        {/* Customer info - always visible at top */}
                        <div className="mb-4">
                            <OrderCustomerSummaryView
                                values={{
                                    address_name: activeOrder.address_name,
                                    customer_name: activeOrder.customer_name,
                                    event_address: activeOrder.event_address,
                                    event_date: activeOrder.event_date,
                                    event_name: activeOrder.event_name,
                                    event_time: activeOrder.event_time,
                                    latitude: activeOrder.latitude,
                                    longitude: activeOrder.longitude,
                                    notes: activeOrder.notes,
                                    phone: activeOrder.phone,
                                }}
                                showLocationAction
                            />
                            <div className="mt-4 border-t border-border/60" />
                        </div>

                        <OrderFormSummaryAside
                            items={[]}
                            menuItems={[]}
                            packages={[]}
                            itemSummaries={
                                orderForSummary
                                    ? orderSnapshotSummaryItems(orderForSummary)
                                    : []
                            }
                            summary={
                                orderForSummary
                                    ? orderSnapshotSummary(orderForSummary)
                                    : { subtotal: 0, total: 0 }
                            }
                            payments={orderForSummary?.payments || []}
                            showCustomerTab={false}
                        />
                    </div>

                    <DrawerFooter className="shrink-0 border-t bg-muted/30 p-4 sm:p-5">
                        <div className="grid grid-cols-3 gap-2 pb-3 text-center text-xs">
                            <SchedulePaymentAmount
                                label="Total"
                                value={activeOrder.total_price}
                            />
                            <SchedulePaymentAmount
                                label="DP"
                                value={activeOrder.dp_amount}
                            />
                            <SchedulePaymentAmount
                                label="Sisa"
                                value={activeOrder.remaining_amount}
                                className={
                                    Number(activeOrder.remaining_amount) > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-emerald-600 dark:text-emerald-400'
                                }
                            />
                        </div>
                        <DrawerClose
                            type="button"
                            className={buttonVariants({
                                variant: 'outline',
                                className: 'w-full',
                            })}
                        >
                            Tutup
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            ) : null}
        </Drawer>
    );
}

function SchedulePaymentAmount({
    className,
    label,
    value,
}: {
    className?: string;
    label: string;
    value: unknown;
}) {
    return (
        <div className="rounded-lg border bg-background p-2">
            <span className="block text-[10px] font-medium text-muted-foreground uppercase">
                {label}
            </span>
            <span
                className={cn(
                    'mt-0.5 block font-semibold text-foreground',
                    className,
                )}
            >
                {formatSchedulePrice(value)}
            </span>
        </div>
    );
}
