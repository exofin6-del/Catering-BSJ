import { AlertCircle, Calendar, ClipboardList, Clock3 } from 'lucide-react';

import { MetricCard } from '@/components/shared/metric-card';

import type { ScheduleStats } from '../types/schedule-types';

export function ScheduleStatsCards({ stats }: { stats: ScheduleStats }) {
    return (
        <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <MetricCard
                label="Jadwal aktif"
                value={String(stats.total)}
                description="Total seluruh jadwal pesanan aktif."
                icon={ClipboardList}
                tone="sky"
            />
            <MetricCard
                label="Hari ini"
                value={String(stats.today)}
                description="Jadwal pesanan catering hari ini."
                icon={Clock3}
                tone="emerald"
            />
            <MetricCard
                label="Mendatang"
                value={String(stats.upcoming)}
                description="Jadwal pesanan masa depan."
                icon={Calendar}
                tone="violet"
            />
            <MetricCard
                label="Terlewat"
                value={String(stats.overdue)}
                description="Jadwal pesanan yang sudah terlewat."
                icon={AlertCircle}
                tone="rose"
            />
        </section>
    );
}
