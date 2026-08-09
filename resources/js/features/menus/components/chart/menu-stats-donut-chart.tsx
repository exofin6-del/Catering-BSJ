'use client';

import { PieChart as PieChartIcon } from 'lucide-react';
import * as React from 'react';

import { DonutChartWithText } from '@/components/charts';
import type { ChartConfig } from '@/components/ui/chart';

import type { MenuIndexStats } from '../../types/menu-types';
import { buildMenuStatsDonutData } from '../../utils/menu-stats-chart';

type MenuStatsDonutChartProps = {
    className?: string;
    stats: MenuIndexStats;
};

const CHART_CONFIG = {
    active: {
        label: 'Aktif',
        color: 'var(--chart-1)',
    },
    inactive: {
        label: 'Nonaktif',
        color: 'var(--chart-2)',
    },
    promo: {
        label: 'Promo',
        color: 'var(--chart-3)',
    },
    recommended: {
        label: 'Rekomendasi',
        color: 'var(--chart-4)',
    },
} satisfies ChartConfig;

export function MenuStatsDonutChart({
    className,
    stats,
}: MenuStatsDonutChartProps) {
    const data = React.useMemo(() => buildMenuStatsDonutData(stats), [stats]);

    return (
        <DonutChartWithText
            centerLabel="Total"
            centerValue={stats.total}
            className={className}
            config={CHART_CONFIG}
            data={data}
            description="Status keaktifan, promo, dan rekomendasi"
            icon={PieChartIcon}
            title="Ringkasan menu"
            totalValue={stats.total}
        />
    );
}
