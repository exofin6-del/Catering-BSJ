'use client';

import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import * as React from 'react';

import { DataTableFilterChips } from '@/components/data-table';
import type { DataTableFilterChip } from '@/components/data-table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type RankedBarListChartItem = {
    id: number | string;
    label: string;
    value: number;
};

type RankedBarListChartProps = {
    className?: string;
    description: string;
    emptyLabel: string;
    filterChips?: DataTableFilterChip[];
    icon?: LucideIcon;
    items: RankedBarListChartItem[];
    title: string;
    valueFormatter: (value: number) => string;
};

type RankedBarListChartDisplayItem = RankedBarListChartItem & {
    formattedValue: string;
    progress: number;
    rank: number;
};

const minimumVisibleProgress = 8;

export function RankedBarListChart({
    className,
    description,
    emptyLabel,
    filterChips = [],
    icon: Icon = TrendingUp,
    items,
    title,
    valueFormatter,
}: RankedBarListChartProps) {
    const rankedItems = React.useMemo<RankedBarListChartDisplayItem[]>(() => {
        const maxValue = items.reduce(
            (max, item) => Math.max(max, item.value),
            0,
        );

        return items.map((item, index) => {
            const progress =
                maxValue > 0
                    ? Math.max(
                          minimumVisibleProgress,
                          (item.value / maxValue) * 100,
                      )
                    : 0;

            return {
                ...item,
                formattedValue: valueFormatter(item.value),
                progress,
                rank: index + 1,
            };
        });
    }, [items, valueFormatter]);

    const hasData = rankedItems.length > 0;

    return (
        <Card className={cn('admin-card flex h-full flex-col', className)}>
            <CardHeader className="gap-3 space-y-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-muted-foreground">
                            <Icon className="size-4.5" />
                        </span>
                        <div className="min-w-0">
                            <CardTitle className="text-md truncate font-semibold tracking-normal">
                                {title}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs">
                                {description}
                            </CardDescription>
                        </div>
                    </div>

                    {filterChips.length > 0 ? (
                        <div className="min-w-0 lg:max-w-80">
                            <DataTableFilterChips
                                chips={filterChips}
                                className="max-w-full"
                            />
                        </div>
                    ) : null}
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col px-4 pb-4 sm:px-6 sm:pb-6">
                {hasData ? (
                    <ol className="flex flex-1 flex-col">
                        {rankedItems.map((item) => (
                            <RankedBarListChartRankItem
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </ol>
                ) : (
                    <div className="flex min-h-[180px] flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 text-muted-foreground">
                        <Icon className="size-7 opacity-25" />
                        <p className="text-sm">{emptyLabel}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RankedBarListChartRankItem({
    item,
}: {
    item: RankedBarListChartDisplayItem;
}) {
    const [width, setWidth] = React.useState(0);

    React.useEffect(() => {
        const timer = window.setTimeout(() => {
            setWidth(item.progress);
        }, 50);

        return () => window.clearTimeout(timer);
    }, [item.progress]);

    return (
        <li className="flex items-center justify-between border-b border-border/60 py-3 last:border-b-0">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                    className={cn(
                        'flex size-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold tabular-nums',
                        rankBadgeClassName(item.rank),
                    )}
                >
                    {item.rank}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-foreground">
                            {item.label}
                        </span>
                        <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                            {item.formattedValue}
                        </span>
                    </div>

                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn(
                                'h-full rounded-full transition-[width] duration-500 ease-out',
                                item.rank === 1
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : 'bg-muted-foreground/30',
                            )}
                            style={{ width: `${width}%` }}
                        />
                    </div>
                </div>
            </div>
        </li>
    );
}

function rankBadgeClassName(rank: number): string {
    if (rank === 1) {
        return 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30';
    }

    if (rank === 2) {
        return 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-sm shadow-blue-500/20';
    }

    if (rank === 3) {
        return 'bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20';
    }

    return 'border border-border/70 bg-background text-muted-foreground';
}
