import { CalendarCheck2, Clock3, Users } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type {
    ScheduleFilters,
    ScheduleItem,
    SchedulePageProps,
} from '../types/schedule-types';
import {
    formatScheduleDate,
    formatScheduleMonthRange,
} from '../utils/schedule-format';

type ScheduleListCardProps = {
    filters: ScheduleFilters;
    items: SchedulePageProps['items'];
    onOrderSelect: (item: ScheduleItem) => void;
    onVisit: (query: Record<string, string | undefined>) => void;
};

export function ScheduleListCard({
    filters,
    items,
    onOrderSelect,
    onVisit,
}: ScheduleListCardProps) {
    const [visibleCount, setVisibleCount] = useState(4);
    const visibleItems = items.data.slice(0, visibleCount);
    const canShowMore = visibleCount < items.data.length;
    const canShowLess = visibleCount > 4;
    const hasMoreItems = items.data.length > 4;

    return (
        <aside className="admin-card min-w-0 p-4 md:p-5">
            <div className="space-y-4 pb-3">
                <div className="flex flex-col items-center gap-3">
                    <div className="grid w-full max-w-[28rem] grid-cols-3 gap-1.5 rounded-md bg-muted/50 p-1 shadow-none">
                        <PeriodButton
                            active={filters.scope === 'day'}
                            label="Hari ini"
                            onClick={() => {
                                const today = new Date();
                                const year = today.getFullYear();
                                const month = String(
                                    today.getMonth() + 1,
                                ).padStart(2, '0');
                                const dateString = `${year}-${month}-${String(today.getDate()).padStart(2, '0')}`;

                                onVisit({
                                    month: `${year}-${month}`,
                                    scope: 'day',
                                    selected_date: dateString,
                                    export_period: 'month',
                                });
                            }}
                        />

                        <PeriodButton
                            active={
                                filters.scope === 'all' &&
                                filters.export_period !== 'all'
                            }
                            label="Bulan ini"
                            onClick={() => {
                                const today = new Date();
                                const year = today.getFullYear();
                                const month = String(
                                    today.getMonth() + 1,
                                ).padStart(2, '0');

                                onVisit({
                                    month: `${year}-${month}`,
                                    scope: 'all',
                                    selected_date: undefined,
                                    export_period: 'month',
                                });
                            }}
                        />

                        <PeriodButton
                            active={
                                filters.scope === 'all' &&
                                filters.export_period === 'all'
                            }
                            label="Semua"
                            onClick={() => {
                                onVisit({
                                    month: filters.month,
                                    scope: 'all',
                                    selected_date: undefined,
                                    export_period: 'all',
                                });
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                    <CardTitle className="text-base font-semibold">
                        {filters.selected_date
                            ? formatScheduleDate(filters.selected_date)
                            : formatScheduleMonthRange(filters.month)}
                    </CardTitle>

                    <p className="text-sm text-muted-foreground">
                        {items.total} order aktif ditemukan
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {items.data.length === 0 ? (
                    <ScheduleListEmptyState />
                ) : (
                    visibleItems.map((item) => (
                        <ScheduleListItem
                            key={item.id}
                            item={item}
                            onSelect={onOrderSelect}
                        />
                    ))
                )}
            </div>

            {hasMoreItems ? (
                <div
                    className={cn(
                        'flex gap-3 pt-3',
                        canShowMore && canShowLess
                            ? 'justify-between'
                            : 'justify-center',
                    )}
                >
                    {canShowLess ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border border-muted/30 bg-background px-4 text-sm font-semibold text-muted-foreground shadow-none transition duration-200 hover:bg-muted/10 hover:text-foreground"
                            onClick={() => {
                                setVisibleCount((count) =>
                                    Math.max(count - 4, 4),
                                );
                            }}
                        >
                            Tampilkan lebih sedikit
                        </Button>
                    ) : null}

                    {canShowMore ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border border-muted/30 bg-background px-4 text-sm font-semibold text-muted-foreground shadow-none transition duration-200 hover:bg-muted/10 hover:text-foreground"
                            onClick={() => {
                                setVisibleCount((count) =>
                                    Math.min(count + 4, items.data.length),
                                );
                            }}
                        >
                            Tampilkan lebih
                        </Button>
                    ) : null}
                </div>
            ) : null}
        </aside>
    );
}

export function ScheduleListEmptyState() {
    return (
        <div className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <CalendarCheck2 className="size-9 text-muted-foreground" />
            <p className="font-medium">Tidak ada jadwal aktif</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Order akan muncul setelah status order di-ACC.
            </p>
        </div>
    );
}

export function ScheduleListItem({
    item,
    onSelect,
}: {
    item: ScheduleItem;
    onSelect?: (item: ScheduleItem) => void;
}) {
    const content = (
        <>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                        {item.event_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {item.order_code} · {item.customer_name}
                    </p>
                </div>
                <Badge
                    variant={
                        item.payment_status === 'paid'
                            ? 'default'
                            : item.payment_status === 'dp_paid'
                              ? 'secondary'
                              : 'outline'
                    }
                >
                    {item.payment_status === 'paid'
                        ? 'Lunas'
                        : item.payment_status === 'dp_paid'
                          ? 'DP'
                          : 'Belum bayar'}
                </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2">
                    <Clock3 className="size-4" />
                    {formatScheduleDate(item.event_date)},{' '}
                    {item.event_time || 'Waktu belum diisi'}
                </span>
                <span className="flex items-center gap-2">
                    <Users className="size-4" />
                    {item.phone}
                </span>
            </div>
        </>
    );

    if (!onSelect) {
        return (
            <div className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent/60">
                {content}
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => onSelect(item)}
            className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            {content}
        </button>
    );
}

function PeriodButton({
    active,
    label,
    onClick,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'inline-flex h-9 w-full items-center justify-center rounded-md px-2.5 text-xs font-medium transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                active
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground',
            )}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
