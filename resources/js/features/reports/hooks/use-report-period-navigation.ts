import { router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReportFilters, ReportPeriod } from '../types/report-types';
import { buildReportQuery } from '../utils/report-utils';

type UseReportPeriodNavigationOptions = {
    filters: ReportFilters;
    targetUrl: string;
};

export function useReportPeriodNavigation({
    filters,
    targetUrl,
}: UseReportPeriodNavigationOptions) {
    const filtersKey = reportFiltersKey(filters);
    const [pendingState, setPendingState] = useState({
        filters,
        key: filtersKey,
    });
    const pendingFilters =
        pendingState.key === filtersKey ? pendingState.filters : filters;
    const setPendingFilters = (nextFilters: ReportFilters) => {
        setPendingState({
            filters: nextFilters,
            key: filtersKey,
        });
    };

    const visitReport = (nextFilters: Partial<ReportFilters> & {}) => {
        router.get(targetUrl, buildReportQuery(nextFilters), {
            preserveScroll: true,
            replace: true,
        });
    };

    const handlePeriodChange = (period: ReportPeriod) => {
        const nextFilters = {
            ...pendingFilters,
            period,
        };

        setPendingFilters(nextFilters);

        if (period !== 'custom') {
            visitReport({ ...filters, period });
        }
    };

    return {
        handlePeriodChange,
        pendingFilters,
        setPendingFilters,
        visitReport,
    };
}

function reportFiltersKey(filters: ReportFilters): string {
    return [filters.end_date, filters.period, filters.start_date].join('|');
}
