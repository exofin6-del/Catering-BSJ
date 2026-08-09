import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReportFilters, ReportPeriod } from '../../types/report-types';
import { reportPeriodOptions } from '../../utils/report-utils';
import { ReportDateRangePicker } from './report-date-range-picker';

type ReportPeriodToolbarProps = {
    filters: ReportFilters;
    pendingFilters: ReportFilters;
    onDateRangeChange: (filters: ReportFilters) => void;
    onPeriodChange: (period: ReportPeriod) => void;
    onPendingFiltersChange: (filters: ReportFilters) => void;
};

export function ReportPeriodToolbar({
    filters,
    pendingFilters,
    onDateRangeChange,
    onPeriodChange,
    onPendingFiltersChange,
}: ReportPeriodToolbarProps) {
    const chipOptions = reportPeriodOptions.filter(
        (option) => option.value !== 'custom',
    );

    return (
        <section
            aria-label="Filter laporan"
            className="flex min-w-0 flex-wrap items-center justify-between gap-2"
        >
            <div className="order-1 flex min-w-0 items-center">
                <ReportDateRangePicker
                    className="sm:w-auto lg:w-auto"
                    endDate={pendingFilters.end_date}
                    isActive={filters.period === 'custom'}
                    startDate={pendingFilters.start_date}
                    onChange={(range) => {
                        const nextFilters = {
                            ...pendingFilters,
                            period: 'custom' as const,
                            start_date: range.startDate,
                            end_date: range.endDate,
                        };

                        onPendingFiltersChange(nextFilters);

                        if (range.isComplete) {
                            onDateRangeChange(nextFilters);
                        }
                    }}
                />
            </div>

            <div className="order-2 flex min-w-0 flex-wrap items-center justify-end gap-2">
                {chipOptions.map((option) => {
                    const isActive = filters.period === option.value;

                    return (
                        <Button
                            key={option.value}
                            aria-pressed={isActive}
                            className={cn(
                                'h-8 rounded-md px-3 text-xs',
                                isActive &&
                                    'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
                            )}
                            size="sm"
                            variant={isActive ? 'default' : 'outline'}
                            onClick={() => onPeriodChange(option.value)}
                        >
                            {option.label}
                        </Button>
                    );
                })}
            </div>
        </section>
    );
}
