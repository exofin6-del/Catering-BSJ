import {
    CalendarDays,
    CheckCircle2,
    Clock,
    RefreshCcw,
    XCircle,
} from 'lucide-react';
import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { DashboardStatusSummary } from '../types/dashboard-types';

type DailyLoadCardProps = {
    className?: string;
    items: DashboardStatusSummary[];
};

export function DailyLoadCard({ className, items }: DailyLoadCardProps) {
    const total = React.useMemo(
        () => items.reduce((sum, item) => sum + item.value, 0),
        [items],
    );

    return (
        <Card className={cn('flex h-full flex-col', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                    Status Order
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Ringkasan status order saat ini
                </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
                {items.length > 0 ? (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <StatusRow
                                key={item.label}
                                item={item}
                                total={total}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </CardContent>
        </Card>
    );
}

function getStatusTone(tone: string) {
    switch (tone) {
        case 'emerald':
            return {
                border: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                iconBg: 'bg-emerald-500/10',
            };
        case 'rose':
            return {
                border: 'border-rose-200 bg-rose-50 text-rose-700',
                iconBg: 'bg-rose-500/10',
            };
        case 'violet':
            return {
                border: 'border-violet-200 bg-violet-50 text-violet-700',
                iconBg: 'bg-violet-500/10',
            };
        default:
            return {
                border: 'border-amber-200 bg-amber-50 text-amber-700',
                iconBg: 'bg-amber-500/10',
            };
    }
}

function getStatusIcon(tone: string) {
    switch (tone) {
        case 'emerald':
            return <CheckCircle2 className="size-4" />;
        case 'rose':
            return <XCircle className="size-4" />;
        case 'violet':
            return <RefreshCcw className="size-4" />;
        default:
            return <Clock className="size-4" />;
    }
}

function StatusRow({
    item,
    total,
}: {
    item: DashboardStatusSummary;
    total: number;
}) {
    const tone = getStatusTone(item.tone);

    return (
        <div
            className={cn(
                'flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-3',
                tone.border,
            )}
        >
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl',
                        tone.iconBg,
                    )}
                >
                    {getStatusIcon(item.tone)}
                </span>
                <div>
                    <p className="text-sm font-semibold text-foreground">
                        {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {total > 0 ? Math.round((item.value / total) * 100) : 0}
                        % dari total
                    </p>
                </div>
            </div>

            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {item.value}
            </span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <CalendarDays className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">
                Belum ada jadwal
            </p>
            <p className="text-xs text-muted-foreground">
                Data akan muncul ketika ada order
            </p>
        </div>
    );
}
