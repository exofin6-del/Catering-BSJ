import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    orderStatusBadgeClass,
    orderStatusLabels,
} from '@/features/orders/utils/order-format';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';
import type {
    ReportBreakdownRow,
    ReportPaymentBreakdownRow,
} from '../../types/report-types';
import {
    formatReportPrice,
    paymentMethodLabels,
    safePercent,
} from '../../utils/report-utils';

const orderedStatuses: OrderStatus[] = ['completed'];

export function ReportStatusBreakdown({
    rows,
}: {
    rows: Record<OrderStatus, ReportBreakdownRow>;
}) {
    const total = orderedStatuses.reduce(
        (sum, status) => sum + (rows[status]?.count ?? 0),
        0,
    );

    return (
        <div className="grid gap-4">
            {orderedStatuses.map((status) => (
                <BreakdownLine
                    key={status}
                    label={orderStatusLabels[status]}
                    percent={safePercent(rows[status]?.count ?? 0, total)}
                    value={`${(rows[status]?.count ?? 0).toLocaleString('id-ID')} order`}
                    valueDetail={formatReportPrice(
                        rows[status]?.total_amount ?? 0,
                    )}
                >
                    <Badge
                        variant="outline"
                        className={cn(
                            'h-5.5 rounded-md border px-2 text-[10px] font-bold tracking-wider uppercase',
                            orderStatusBadgeClass(status),
                        )}
                    >
                        {orderStatusLabels[status]}
                    </Badge>
                </BreakdownLine>
            ))}
        </div>
    );
}

export function ReportPaymentBreakdown({
    rows,
}: {
    rows: ReportPaymentBreakdownRow[];
}) {
    const total = rows.reduce((sum, row) => sum + row.total_amount, 0);

    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-slate-50/30 p-8 text-center text-sm text-muted-foreground dark:bg-muted/5">
                <p className="leading-relaxed">
                    Belum ada pembayaran pada periode ini.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {rows.map((row) => (
                <BreakdownLine
                    key={row.method}
                    label={paymentMethodLabels[row.method] ?? row.method}
                    percent={safePercent(row.total_amount, total)}
                    value={`${row.count.toLocaleString('id-ID')} transaksi`}
                    valueDetail={formatReportPrice(row.total_amount)}
                />
            ))}
        </div>
    );
}

function BreakdownLine({
    children,
    label,
    percent,
    value,
    valueDetail,
}: {
    children?: ReactNode;
    label: string;
    percent: number;
    value: string;
    valueDetail: string;
}) {
    return (
        <div className="group grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    {children ?? (
                        <span className="text-[13px] font-semibold text-foreground/90 group-hover:text-foreground">
                            {label}
                        </span>
                    )}
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-[13.5px] font-bold text-foreground/90 tabular-nums">
                        {valueDetail}
                    </div>
                    <div className="text-[11px] font-medium tracking-tight text-muted-foreground/70 uppercase">
                        {value}
                    </div>
                </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50 shadow-inner shadow-black/[0.02]">
                <div
                    className="h-full rounded-full bg-primary/80 transition-all duration-1000 group-hover:bg-primary"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
