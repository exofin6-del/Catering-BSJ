import { Head, usePoll } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';

import { DailyLoadCard } from '@/features/dashboard/components/daily-load-card';
import { SectionCards } from '@/features/dashboard/components/section-cards';
import { UpcomingOrdersCard } from '@/features/dashboard/components/upcoming-orders-card';
import type { DashboardPageProps } from '@/features/dashboard/types/dashboard-types';
import { emptyDashboardStats } from '@/features/dashboard/types/dashboard-types';
import { formatDashboardCurrency } from '@/features/dashboard/utils/dashboard-format';
import { dashboard } from '@/routes';

export default function Dashboard({
    dailyLoads = [],
    orderTraffic = [],
    stats = emptyDashboardStats,
    statusSummary = [],
    upcomingOrders = [],
}: Partial<DashboardPageProps>) {
    usePoll(5000);

    const today = format(new Date(), 'EEEE, d MMMM yyyy', { locale: id });

    return (
        <>
            <Head title="Dashboard" />

            <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        <span>{today}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <span>
                            Revenue:{' '}
                            <span className="font-medium text-foreground">
                                {formatDashboardCurrency(
                                    stats.revenue_this_month,
                                )}
                            </span>
                        </span>
                    </div>
                </div>

                {/* KPI Cards */}
                <SectionCards
                    dailyLoads={dailyLoads}
                    orderTraffic={orderTraffic}
                    stats={stats}
                />

                {/* Charts & Data */}
                <div className="grid grid-cols-1 gap-6 @4xl/main:grid-cols-2">
                    <DailyLoadCard items={statusSummary} />
                    <UpcomingOrdersCard items={upcomingOrders} />
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    title: 'Dashboard',
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
