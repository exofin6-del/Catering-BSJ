import type { DonutChartDataItem } from '@/components/charts';

import type { PackageIndexStats } from '../types/package-types';

export function buildPackageStatsDonutData(
    stats: PackageIndexStats,
): DonutChartDataItem[] {
    const inactiveCount = Math.max(0, stats.total - stats.active);

    return [
        {
            id: 'active',
            label: 'Aktif',
            value: stats.active,
        },
        {
            id: 'inactive',
            label: 'Nonaktif',
            value: inactiveCount,
        },
        {
            id: 'promo',
            label: 'Promo',
            value: stats.promo,
        },
        {
            id: 'recommended',
            label: 'Rekomendasi',
            value: stats.recommended,
        },
    ];
}
