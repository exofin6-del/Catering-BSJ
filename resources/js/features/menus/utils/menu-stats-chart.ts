import type { DonutChartDataItem } from '@/components/charts';

import type { MenuIndexStats, MenuTopOrderedItem } from '../types/menu-types';

export const defaultMenuIndexStats: MenuIndexStats = {
    active: 0,
    promo: 0,
    recommended: 0,
    total: 0,
    uncategorized: 0,
};

export const defaultMenuTopOrderedItems: MenuTopOrderedItem[] = [];

export function buildMenuStatsDonutData(
    stats: MenuIndexStats,
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
