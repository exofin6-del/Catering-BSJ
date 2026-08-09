import * as React from 'react';

import { RankedBarListChart } from '@/components/charts';
import type { DataTableFilterChip } from '@/components/data-table';

import type { PackageTopOrderedItem } from '../../types/package-types';

type PackageTopOrderedBarChartProps = {
    className?: string;
    filterChips?: DataTableFilterChip[];
    items: PackageTopOrderedItem[];
};

export function PackageTopOrderedBarChart({
    className,
    filterChips = [],
    items,
}: PackageTopOrderedBarChartProps) {
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
            emptyLabel="Belum ada data order paket"
            filterChips={filterChips}
            items={chartItems}
            title="Paket terpopuler"
            valueFormatter={formatOrderCount}
        />
    );
}

function formatOrderCount(value: number): string {
    return `${new Intl.NumberFormat('id-ID').format(value)} order`;
}
