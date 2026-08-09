import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportDateGroup } from '../../utils/report-group-utils';
import { formatReportPrice } from '../../utils/report-utils';
import { ReportOrderCard } from './report-order-card';

export function ReportDateGroupSection({
    group,
    isCollapsed,
    onToggle,
}: {
    group: ReportDateGroup;
    isCollapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="overflow-hidden">
            <ReportDateHeader
                count={group.orders.length}
                isCollapsed={isCollapsed}
                label={group.label}
                totalPaid={group.totalPaid}
                onToggle={onToggle}
            />

            {!isCollapsed && (
                <div className="space-y-2 pt-1.5">
                    {group.orders.map((order) => (
                        <ReportOrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ReportDateHeader({
    count,
    isCollapsed,
    label,
    onToggle,
    totalPaid,
}: {
    count: number;
    isCollapsed: boolean;
    label: string;
    onToggle: () => void;
    totalPaid: number;
}) {
    return (
        <button
            type="button"
            className={cn(
                'group flex w-full items-center justify-between gap-4 px-3 py-2 text-left transition-colors hover:bg-muted/20',
            )}
            aria-expanded={!isCollapsed}
            onClick={onToggle}
        >
            <div className="grid min-w-0 gap-0">
                <h4 className="text-xs font-semibold text-foreground/80 group-hover:text-foreground">
                    {label}
                </h4>
                <div className="text-[11px] text-muted-foreground/60">
                    <span>{count.toLocaleString('id-ID')} pesanan</span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold text-foreground/60 tabular-nums group-hover:text-foreground/80">
                    {formatReportPrice(totalPaid)}
                </span>
                <ChevronDown
                    className={cn(
                        'size-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:text-muted-foreground/70',
                        !isCollapsed && 'rotate-180',
                    )}
                />
            </div>
        </button>
    );
}
