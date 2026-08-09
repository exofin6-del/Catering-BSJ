import { Link } from '@inertiajs/react';
import { ArrowUpRight, CalendarClock, CalendarX2, Clock4 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import orderRoute from '@/routes/order';

import type { DashboardUpcomingOrder } from '../types/dashboard-types';
import {
    formatDashboardCurrency,
    formatDashboardDate,
} from '../utils/dashboard-format';

const paymentStatusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' }
> = {
    dp_paid: { label: 'DP', variant: 'secondary' },
    paid: { label: 'Lunas', variant: 'default' },
    unpaid: { label: 'Belum Bayar', variant: 'destructive' },
};

type UpcomingOrdersCardProps = {
    className?: string;
    items: DashboardUpcomingOrder[];
};

export function UpcomingOrdersCard({
    className,
    items,
}: UpcomingOrdersCardProps) {
    return (
        <Card className={cn('flex h-full flex-col', className)}>
            <CardHeader className="flex-row items-center justify-between gap-2 pb-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarClock className="size-4" />
                    </span>
                    <div>
                        <CardTitle className="text-base font-semibold">
                            Jadwal Mendatang
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Event terdekat
                        </p>
                    </div>
                </div>
                {items.length > 0 && (
                    <Badge variant="outline" className="tabular-nums">
                        {items.length}
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-0 p-0">
                {items.length > 0 ? (
                    <ul className="divide-y">
                        {items.map((item, index) => (
                            <UpcomingOrderRow
                                key={item.id}
                                item={item}
                                index={index}
                            />
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
                        <CalendarX2 className="size-8 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-foreground">
                            Tidak ada jadwal
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Order aktif akan muncul di sini
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function UpcomingOrderRow({
    item,
    index,
}: {
    item: DashboardUpcomingOrder;
    index: number;
}) {
    const status = paymentStatusConfig[item.payment_status];

    return (
        <li>
            <Link
                href={orderRoute.show(item.id)}
                prefetch
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
            >
                {/* Index */}
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/60 text-xs font-semibold text-muted-foreground tabular-nums">
                    {index + 1}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-xs font-medium">
                            {item.order_code}
                        </span>
                        {status && (
                            <Badge
                                variant={status.variant}
                                className="rounded-full px-1.5 py-0 text-[10px]"
                            >
                                {status.label}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 truncate">
                        <p className="truncate text-sm font-medium">
                            {item.customer_name}
                        </p>
                    </div>
                    {item.event_name && (
                        <p className="truncate text-xs text-muted-foreground">
                            {item.event_name}
                        </p>
                    )}
                </div>

                {/* Date & Price */}
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 text-xs">
                        <Clock4 className="size-3 text-muted-foreground" />
                        <span className="font-medium tabular-nums">
                            {formatDashboardDate(item.event_date)}
                        </span>
                    </div>
                    {item.event_time && (
                        <span className="text-[11px] text-muted-foreground">
                            {item.event_time}
                        </span>
                    )}
                    <span className="text-sm font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                        {formatDashboardCurrency(item.total_price)}
                    </span>
                </div>

                {/* Arrow */}
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/40 transition group-hover:text-muted-foreground" />
            </Link>
        </li>
    );
}
