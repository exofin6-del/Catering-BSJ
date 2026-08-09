import { router } from '@inertiajs/react';
import * as React from 'react';

import schedule from '@/routes/schedule';
import type { Order } from '@/types';

import type { ScheduleFilters, ScheduleItem } from '../types/schedule-types';

type ScheduleVisitQuery = Record<string, string | undefined>;

export function useScheduleIndex(month: string, filters: ScheduleFilters) {
    const [activeOrder, setActiveOrder] = React.useState<ScheduleItem | null>(
        null,
    );

    const currentYear = month.substring(0, 4);
    const currentMonth = month.substring(5, 7);

    const orderForSummary = React.useMemo<Order | null>(() => {
        if (!activeOrder) {
            return null;
        }

        return {
            ...activeOrder,
            items: activeOrder.order_items || [],
        };
    }, [activeOrder]);

    const visit = React.useCallback((query: ScheduleVisitQuery) => {
        router.get(schedule.index.url(), query, {
            preserveScroll: true,
            preserveState: true,
        });
    }, []);

    const refresh = React.useCallback(() => {
        const query: ScheduleVisitQuery = {
            month: filters.month,
        };

        if (filters.scope === 'day' && filters.selected_date) {
            query.scope = 'day';
            query.selected_date = filters.selected_date;
            query.export_period = filters.export_period;
        } else {
            query.scope = 'all';
            query.export_period = filters.export_period;
        }

        router.get(schedule.index.url(), query, {
            preserveScroll: true,
            preserveState: false,
        });
    }, [
        filters.month,
        filters.scope,
        filters.selected_date,
        filters.export_period,
    ]);

    return {
        activeOrder,
        currentMonth,
        currentYear,
        orderForSummary,
        setActiveOrder,
        visit,
        refresh,
    };
}
