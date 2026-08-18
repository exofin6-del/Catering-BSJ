import { Head, usePoll } from '@inertiajs/react';

import { DailyLoadCard } from '@/features/dashboard/components/daily-load-card';
import { SectionCards } from '@/features/dashboard/components/section-cards';
import { UpcomingOrdersCard } from '@/features/dashboard/components/upcoming-orders-card';
import type { DashboardPageProps } from '@/features/dashboard/types/dashboard-types';
import { emptyDashboardStats } from '@/features/dashboard/types/dashboard-types';
import { dashboard } from '@/routes';

export default function Dashboard({
    dailyLoads = [],
    orderTraffic = [],
    stats = emptyDashboardStats,
    statusSummary = [],
    upcomingOrders = [],
}: Partial<DashboardPageProps>) {
    usePoll(5000);

    return (
        <>
            <Head title="Dashboard" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-5 lg:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
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
