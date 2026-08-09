import { ReceiptText } from 'lucide-react';
import { useState } from 'react';
import type { ReportOrder } from '../../types/report-types';
import { groupedOrders } from '../../utils/report-group-utils';
import { ReportMonthGroupSection } from './report-month-group';

type ReportOrderHistoryTableProps = {
    orders: {
        data: ReportOrder[];
        total_orders: number;
    };
};

function isCurrentMonth(monthId: string): boolean {
    const now = new Date();
    const currentKey = `month-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return monthId === currentKey;
}

export function ReportOrderHistoryTable({
    orders,
}: ReportOrderHistoryTableProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<
        Record<string, boolean>
    >({});
    const groups = groupedOrders(orders.data);
    const hasOrders = orders.data.length > 0;

    function isGroupCollapsed(groupId: string): boolean {
        // Bulan default terbuka, Tanggal default tertutup (true)
        const defaultValue = groupId.startsWith('month-') ? false : true;

        return collapsedGroups[groupId] ?? defaultValue;
    }

    function toggleGroup(groupId: string) {
        setCollapsedGroups((current) => ({
            ...current,
            [groupId]: !isGroupCollapsed(groupId),
        }));
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border/40 bg-card shadow-sm">
            {!hasOrders ? (
                <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-border/60 p-8 text-center">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted/40">
                        <ReceiptText className="size-6 text-muted-foreground/40" />
                    </div>
                    <h4 className="mb-1 text-sm font-semibold text-foreground">
                        Belum ada data
                    </h4>
                    <p className="max-w-[280px] text-sm text-muted-foreground">
                        Riwayat transaksi akan muncul di sini setelah pesanan
                        diselesaikan dan dilunasi.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-border/40">
                    {groups.map((group) => (
                        <ReportMonthGroupSection
                            key={group.id}
                            group={group}
                            isCurrentMonth={isCurrentMonth(group.id)}
                            isGroupCollapsed={isGroupCollapsed}
                            onToggleGroup={toggleGroup}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
