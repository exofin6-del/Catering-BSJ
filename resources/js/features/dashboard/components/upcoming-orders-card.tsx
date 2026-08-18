import { Link } from '@inertiajs/react';
import { CalendarClock, CalendarX2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScheduleListItem } from '@/features/schedules/components/schedule-list-card';
import { cn } from '@/lib/utils';
import orderRoute from '@/routes/order';

import type { DashboardUpcomingOrder } from '../types/dashboard-types';

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
            <CardHeader className="flex w-full flex-row items-center justify-between gap-2 pb-4">
                <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarClock className="size-4" />
                    </span>

                    <div className="min-w-0">
                        <CardTitle className="truncate text-base font-semibold">
                            Jadwal Mendatang
                        </CardTitle>

                        <p className="truncate text-xs text-muted-foreground">
                            Event terdekat
                        </p>
                    </div>
                </div>

                {items.length > 0 && (
                    <Badge variant="outline" className="shrink-0 tabular-nums">
                        {items.length}
                    </Badge>
                )}
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-3 p-4">
                {items.length > 0 ? (
                    items.map((item) => (
                        <Link
                            key={item.id}
                            href={orderRoute.show(item.id)}
                            prefetch
                            className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <ScheduleListItem item={item} />
                        </Link>
                    ))
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
