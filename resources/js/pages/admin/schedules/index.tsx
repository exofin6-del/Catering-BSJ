import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

import { ScheduleCalendarCard } from '@/features/schedules/components/schedule-calendar-card';
import { ScheduleDetailDrawer } from '@/features/schedules/components/schedule-detail-drawer';
import { ScheduleExportDropdown } from '@/features/schedules/components/schedule-export-dropdown';
import { ScheduleListCard } from '@/features/schedules/components/schedule-list-card';
import { ScheduleStatsCards } from '@/features/schedules/components/schedule-stats';
import { useScheduleIndex } from '@/features/schedules/hooks/use-schedule-index';
import type { SchedulePageProps } from '@/features/schedules/types/schedule-types';
import { dashboard } from '@/routes';
import schedule from '@/routes/schedule';

export default function ScheduleIndexPage({
    calendarDays,
    filters,
    items,
    stats,
}: SchedulePageProps) {
    const {
        activeOrder,
        currentMonth,
        currentYear,
        orderForSummary,
        setActiveOrder,
        visit,
        refresh,
    } = useScheduleIndex(filters.month, filters);

    useEffect(() => {
        const handleOrderAccepted = () => {
            refresh();
            window.sessionStorage.removeItem('order-accepted');
        };

        if (window.sessionStorage.getItem('order-accepted')) {
            refresh();
            window.sessionStorage.removeItem('order-accepted');
        }

        window.addEventListener('order-accepted', handleOrderAccepted);

        return () => {
            window.removeEventListener('order-accepted', handleOrderAccepted);
        };
    }, [refresh]);

    return (
        <>
            <Head title="Jadwal" />
            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <ScheduleStatsCards stats={stats} />

                <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
                    <ScheduleCalendarCard
                        calendarDays={calendarDays}
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        month={filters.month}
                        onVisit={visit}
                    />

                    <ScheduleListCard
                        filters={filters}
                        items={items}
                        onOrderSelect={setActiveOrder}
                        onVisit={visit}
                    />
                </div>
            </div>

            <ScheduleDetailDrawer
                activeOrder={activeOrder}
                orderForSummary={orderForSummary}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveOrder(null);
                    }
                }}
            />
        </>
    );
}

ScheduleIndexPage.layout = () => ({
    title: 'Jadwal',
    description: 'Pantau order yang sudah di-ACC.',
    action: {
        label: 'Ekspor',
        content: <ScheduleExportDropdown />,
    },
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Jadwal', href: schedule.index() },
    ],
});
