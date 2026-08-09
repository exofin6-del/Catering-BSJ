import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type ReportMetricTone = 'amber' | 'emerald' | 'rose' | 'sky' | 'slate';

type ReportMetricCardProps = {
    description: string;
    icon: LucideIcon;
    label: string;
    tone?: ReportMetricTone;
    value: string;
};

const toneClasses: Record<ReportMetricTone, { icon: string; value: string }> = {
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
};

export function ReportMetricCard({
    description,
    icon: Icon,
    label,
    tone = 'slate',
    value,
}: ReportMetricCardProps) {
    const classes = toneClasses[tone];

    return (
        <Card
            className={cn(
                'app-card group relative overflow-hidden rounded-xl border border-border/70 bg-card py-0 text-card-foreground shadow-sm shadow-black/[0.03] backdrop-blur-sm transition-shadow dark:bg-background dark:shadow-none',
                'hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-none',
            )}
        >
            <CardContent className="flex items-start justify-between gap-2 p-3 sm:gap-4 sm:p-6">
                <div className="grid min-w-0 gap-1.5">
                    <span className="truncate text-[10px] leading-tight font-semibold tracking-wider text-muted-foreground/80 uppercase sm:text-xs">
                        {label}
                    </span>
                    <span
                        className={cn(
                            'text-lg leading-none font-bold tracking-tight break-words tabular-nums sm:text-[clamp(1.125rem,3vw,1.5rem)]',
                            classes.value,
                        )}
                    >
                        {value}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70 sm:text-xs">
                        {description}
                    </span>
                </div>
                <span
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-110 sm:size-11 sm:rounded-2xl',
                        classes.icon,
                    )}
                >
                    <Icon className="size-4 sm:size-5" strokeWidth={2.5} />
                </span>
            </CardContent>

            {/* Subtle decorative elements */}
            <div
                className={cn(
                    'absolute -right-4 -bottom-4 size-24 opacity-[0.03] dark:opacity-[0.05]',
                    classes.value,
                )}
            >
                <Icon className="size-full rotate-12" />
            </div>
        </Card>
    );
}
