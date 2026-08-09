import * as React from 'react';

import { RankedBarListChart } from '@/components/charts';
import type { DataTableFilterChip } from '@/components/data-table';

import type { MenuTopOrderedItem } from '../../types/menu-types';

type MenuTopOrderedBarChartProps = {
    className?: string;
    filterChips?: DataTableFilterChip[];
    items: MenuTopOrderedItem[];
};

export function MenuTopOrderedBarChart({
    className,
    filterChips = [],
    items,
}: MenuTopOrderedBarChartProps) {
    const chartItems = React.useMemo(() => {
        return items.map((item) => ({
            id: item.id,
            label: item.name,
            value: item.ordered_count,
        }));
    }, [items]);

    return (
        <RankedBarListChart
            className={className}
            description="Ranking berdasarkan jumlah order"
            emptyLabel="Belum ada data order"
            filterChips={filterChips}
            items={chartItems}
            title="Menu terpopuler"
            valueFormatter={formatOrderCount}
        />
    );
}

function formatOrderCount(value: number): string {
    return `${new Intl.NumberFormat('id-ID').format(value)} order`;
}
