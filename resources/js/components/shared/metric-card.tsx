import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type MetricCardTone =
    | 'amber'
    | 'emerald'
    | 'rose'
    | 'sky'
    | 'slate'
    | 'violet';

const metricToneClasses: Record<
    MetricCardTone,
    { icon: string; value: string }
> = {
    amber: {
        icon: 'border-amber-200/50 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
        value: 'text-amber-700 dark:text-amber-300',
    },
    emerald: {
        icon: 'border-emerald-200/50 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400',
        value: 'text-emerald-700 dark:text-emerald-300',
    },
    rose: {
        icon: 'border-rose-200/50 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400',
        value: 'text-rose-700 dark:text-rose-300',
    },
    sky: {
        icon: 'border-sky-200/50 bg-sky-50 text-sky-600 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400',
        value: 'text-sky-700 dark:text-sky-300',
    },
    slate: {
        icon: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400',
        value: 'text-slate-950 dark:text-foreground',
    },
    violet: {
        icon: 'border-violet-200/50 bg-violet-50 text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400',
        value: 'text-violet-700 dark:text-violet-300',
    },
};

export function MetricCard({
    className,
    description,
    icon: Icon,
    label,
    tone = 'slate',
    value,
    isAlert = false,
    children,
}: {
    className?: string;
    description?: string;
    icon?: LucideIcon;
    label: string;
    tone?: MetricCardTone;
    value: string;
    isAlert?: boolean;
    children?: React.ReactNode;
}) {
    const toneClasses = metricToneClasses[tone];

    return (
        <Card
            className={cn(
                'admin-card group relative overflow-hidden rounded-xl bg-card py-0 shadow-sm shadow-black/[0.03] dark:bg-background dark:shadow-none',
                isAlert &&
                    tone === 'rose' &&
                    'border-rose-500/20 bg-linear-to-br from-card via-card to-rose-500/[0.04]',
                className,
            )}
        >
            <CardContent className="flex items-start justify-between gap-2 p-3 sm:gap-4 sm:p-6">
                <div className="grid min-w-0 flex-1 gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="truncate text-[10px] leading-tight font-semibold tracking-wider text-muted-foreground/80 uppercase sm:text-xs">
                            {label}
                        </span>
                        {isAlert && (
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                            </span>
                        )}
                    </div>
                    <span
                        className={cn(
                            'text-lg leading-none font-bold tracking-tight break-words tabular-nums sm:text-[clamp(1.125rem,3vw,1.5rem)]',
                            toneClasses.value,
                        )}
                    >
                        {value}
                    </span>
                    {description && (
                        <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70 sm:text-xs">
                            {description}
                        </span>
                    )}
                    {children}
                </div>

                {Icon && (
                    <span
                        className={cn(
                            'flex size-9 shrink-0 items-center justify-center rounded-xl border sm:size-11 sm:rounded-2xl',
                            toneClasses.icon,
                            isAlert &&
                                tone === 'rose' &&
                                'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
                        )}
                    >
                        <Icon className="size-4 sm:size-5" strokeWidth={2.5} />
                    </span>
                )}
            </CardContent>

            {Icon && (
                <div
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none absolute -right-4 -bottom-4 size-24 opacity-[0.03] dark:opacity-[0.05]',
                        toneClasses.value,
                    )}
                >
                    <Icon className="size-full rotate-12" />
                </div>
            )}
        </Card>
    );
}
