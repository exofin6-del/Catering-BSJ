export type ScheduleExportPeriod = 'all' | 'custom' | 'month' | 'today';

export function buildScheduleExportQuery(
    period: ScheduleExportPeriod,
    startDate: string,
    endDate: string,
): Record<string, string> {
    if (period === 'all') {
        return {
            export_period: 'all',
            scope: 'all',
            sort_by: 'event_date',
            sort_dir: 'asc',
        };
    }

    return {
        event_date_from: startDate,
        event_date_to: endDate,
        scope: 'all',
        sort_by: 'event_date',
        sort_dir: 'asc',
    };
}
