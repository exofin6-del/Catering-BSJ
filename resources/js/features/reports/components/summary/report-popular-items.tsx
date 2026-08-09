import { PackageOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportPopularItem } from '../../types/report-types';
import { formatReportPrice } from '../../utils/report-utils';

type ReportPopularItemsProps = {
    emptyText: string;
    items: ReportPopularItem[];
};

export function ReportPopularItems({
    emptyText,
    items,
}: ReportPopularItemsProps) {
    if (items.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-slate-50/30 p-8 text-center text-sm text-muted-foreground dark:bg-muted/5">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
                    <PackageOpen className="size-6 text-muted-foreground/40" />
                </div>
                <p className="max-w-[200px] leading-relaxed">{emptyText}</p>
            </div>
        );
    }

    const maxQty = Math.max(...items.map((item) => item.qty), 1);

    return (
        <div className="grid gap-5">
            {items.map((item, index) => (
                <article
                    key={`${item.id}-${item.name}`}
                    className="group grid gap-2.5 transition-all"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <span
                                className={cn(
                                    'flex size-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors',
                                    index === 0
                                        ? 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400'
                                        : 'border-border/50 bg-background text-muted-foreground group-hover:bg-muted/50',
                                )}
                            >
                                {index + 1}
                            </span>
                            <div className="grid min-w-0 gap-0.5">
                                <span className="truncate text-[13.5px] font-semibold tracking-tight text-foreground/90 group-hover:text-foreground">
                                    {item.name}
                                </span>
                                <span className="text-[11px] font-medium text-muted-foreground/80">
                                    {item.qty.toLocaleString('id-ID')} terjual
                                </span>
                            </div>
                        </div>
                        <span className="shrink-0 text-[13.5px] font-bold text-foreground/90 tabular-nums">
                            {formatReportPrice(item.revenue)}
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted/50 shadow-inner shadow-black/[0.02]">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-90',
                                index === 0
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm shadow-amber-500/20'
                                    : 'bg-gradient-to-r from-primary/70 to-primary shadow-sm shadow-primary/10',
                            )}
                            style={{
                                width: `${Math.round((item.qty / maxQty) * 100)}%`,
                            }}
                        />
                    </div>
                </article>
            ))}
        </div>
    );
}
