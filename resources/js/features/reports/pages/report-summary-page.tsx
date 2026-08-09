import { BarChart3, ClipboardList, Crown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import reportRoute from '@/routes/report';
import { ReportPeriodToolbar } from '../components/shared/report-period-toolbar';
import { ReportMetricCard } from '../components/summary/report-metric-card';
import { ReportOrderHistoryTable } from '../components/table/report-order-history-table';
import { useReportPeriodNavigation } from '../hooks/use-report-period-navigation';
import type { ReportPageProps } from '../types/report-types';
import {
    formatReportPrice,
    reportPeriodSentenceLabel,
} from '../utils/report-utils';

export function ReportSummaryPage({
    filters,
    orders,

    summary,
}: ReportPageProps) {
    const {
        handlePeriodChange,
        pendingFilters,
        setPendingFilters,
        visitReport,
    } = useReportPeriodNavigation({
        filters,
        targetUrl: reportRoute.index.url(),
    });

    const periodLabel = useMemo(
        () => reportPeriodSentenceLabel(filters),
        [filters],
    );

    const highestOrderDate = useMemo(() => {
        if (!summary.highest_order_date) {
            return null;
        }

        return new Date(summary.highest_order_date).toLocaleDateString(
            'id-ID',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            },
        );
    }, [summary.highest_order_date]);

    return (
        <div className="grid min-w-0 gap-6 px-4 py-4 md:px-6 md:py-6">
            <ReportPeriodToolbar
                filters={filters}
                pendingFilters={pendingFilters}
                onDateRangeChange={(nextFilters) => visitReport(nextFilters)}
                onPeriodChange={handlePeriodChange}
                onPendingFiltersChange={setPendingFilters}
            />

            <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <ReportMetricCard
                    description={`Total nilai pesanan selesai periode ${periodLabel}.`}
                    icon={TrendingUp}
                    label="Omset"
                    tone="emerald"
                    value={formatReportPrice(summary.total_revenue)}
                />
                <ReportMetricCard
                    description={
                        highestOrderDate
                            ? `Total tertinggi pada tanggal ${highestOrderDate}.`
                            : 'Belum ada pesanan pada periode ini.'
                    }
                    icon={Crown}
                    label="Order Tertinggi"
                    tone="sky"
                    value={formatReportPrice(summary.highest_order_value)}
                />
                <ReportMetricCard
                    description="Jumlah pesanan selesai pada periode ini."
                    icon={ClipboardList}
                    label="Order Selesai"
                    tone="slate"
                    value={summary.order_count.toLocaleString('id-ID')}
                />
                <ReportMetricCard
                    description="Nilai rata-rata setiap pesanan selesai."
                    icon={BarChart3}
                    label="Rata-rata"
                    tone="rose"
                    value={formatReportPrice(summary.average_order_value)}
                />
            </section>

            <div className="grid min-w-0 gap-6 lg:grid-cols-2">
                <div className="lg:col-span-2">
                    <ReportOrderHistoryTable orders={orders} />
                </div>
            </div>
        </div>
    );
}
