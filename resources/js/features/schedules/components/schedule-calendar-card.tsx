import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import type { ScheduleDay } from '../types/schedule-types';
import {
    moveScheduleMonth,
    scheduleMonthName,
    scheduleYearOptions,
} from '../utils/schedule-format';

type ScheduleCalendarCardProps = {
    calendarDays: ScheduleDay[];
    currentMonth: string;
    currentYear: string;
    compact?: boolean;
    isDayDisabled?: (day: ScheduleDay) => boolean;
    maxOrdersPerDay?: number;
    month: string;
    onVisit: (query: Record<string, string | undefined>) => void;
    className?: string;
    showEventBadge?: boolean;
};

const DAYS_OF_WEEK = [
    { short: 'Sen', full: 'Senin' },
    { short: 'Sel', full: 'Selasa' },
    { short: 'Rab', full: 'Rabu' },
    { short: 'Kam', full: 'Kamis' },
    { short: 'Jum', full: 'Jumat' },
    { short: 'Sab', full: 'Sabtu' },
    { short: 'Min', full: 'Minggu' },
] as const;

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
);

function getFirstDayOffset(calendarDays: ScheduleDay[]): number {
    const firstDay = calendarDays[0];

    if (!firstDay) {
        return 0;
    }

    const dayIndex = new Date(`${firstDay.date}T00:00:00`).getDay();

    // Mengubah urutan Minggu–Sabtu menjadi Senin–Minggu.
    return (dayIndex + 6) % 7;
}

export function ScheduleCalendarCard({
    calendarDays,
    compact = false,
    currentMonth,
    currentYear,
    isDayDisabled,
    maxOrdersPerDay,
    month,
    onVisit,
    className,
    showEventBadge = true,
}: ScheduleCalendarCardProps) {
    const firstDayOffset = getFirstDayOffset(calendarDays);
    const yearOptions = scheduleYearOptions();

    const handlePreviousMonth = () => {
        onVisit({
            month: moveScheduleMonth(month, -1),
            scope: 'all',
            selected_date: undefined,
        });
    };

    const handleNextMonth = () => {
        onVisit({
            month: moveScheduleMonth(month, 1),
            scope: 'all',
            selected_date: undefined,
        });
    };

    const handleMonthChange = (selectedMonth: string) => {
        onVisit({
            month: `${currentYear}-${selectedMonth}`,
            scope: 'all',
            selected_date: undefined,
        });
    };

    const handleYearChange = (selectedYear: string) => {
        onVisit({
            month: `${selectedYear}-${currentMonth}`,
            scope: 'all',
            selected_date: undefined,
        });
    };

    const handleDayClick = (date: string) => {
        onVisit({
            month,
            scope: 'day',
            selected_date: date,
        });
    };

    return (
        <section
            className={cn(
                'admin-card min-w-0 overflow-hidden',
                compact ? 'p-0' : 'p-3 sm:p-4 md:p-5',
                className,
            )}
        >
            {/* Header: [ < ]  [ Bulan Tahun ]  [ Hari Ini > ] */}
            <header
                className={cn(
                    'flex items-center justify-between',
                    compact ? 'mb-2 px-0' : 'mb-4 px-1 sm:mb-6 sm:px-2',
                )}
            >
                {/* Kiri: panah sebelumnya */}
                <div
                    className={cn(
                        'flex shrink-0 items-center justify-start',
                        compact ? 'w-8' : 'w-10 sm:w-12',
                    )}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'rounded-full',
                            compact ? 'size-7' : 'size-8 sm:size-9',
                        )}
                        aria-label="Bulan sebelumnya"
                        onClick={handlePreviousMonth}
                    >
                        <ChevronLeft className="size-4" aria-hidden="true" />
                    </Button>
                </div>

                {/* Tengah: dropdown bulan & tahun */}
                <div className="flex flex-1 items-center justify-center gap-1">
                    <Select
                        value={currentMonth}
                        onValueChange={handleMonthChange}
                    >
                        <SelectTrigger
                            aria-label="Pilih bulan"
                            className={cn(
                                'justify-between border-0 bg-transparent font-semibold shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-0 focus-visible:ring-0',
                                compact
                                    ? 'h-7 w-[88px] px-1 text-xs'
                                    : 'h-8 w-[105px] px-2 text-sm sm:h-10 sm:w-[130px] sm:px-3 sm:text-base',
                            )}
                        >
                            <SelectValue placeholder="Bulan" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] min-w-[105px]">
                            {MONTH_OPTIONS.map((optionMonth) => (
                                <SelectItem
                                    key={optionMonth}
                                    value={optionMonth}
                                    className="justify-center text-center sm:text-base"
                                >
                                    {scheduleMonthName(optionMonth)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={currentYear}
                        onValueChange={handleYearChange}
                    >
                        <SelectTrigger
                            aria-label="Pilih tahun"
                            className={cn(
                                'justify-between border-0 bg-transparent font-semibold shadow-none transition-colors hover:bg-accent hover:text-accent-foreground focus:ring-0 focus-visible:ring-0',
                                compact
                                    ? 'h-7 w-[62px] px-1 text-xs'
                                    : 'h-8 w-[72px] px-2 text-sm sm:h-10 sm:w-[86px] sm:px-3 sm:text-base',
                            )}
                        >
                            <SelectValue placeholder="Tahun" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] min-w-[72px]">
                            {yearOptions.map((year) => (
                                <SelectItem
                                    key={year}
                                    value={year}
                                    className="justify-center text-center sm:text-base"
                                >
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Kanan: tombol Hari Ini + panah berikutnya */}
                <div
                    className={cn(
                        'flex shrink-0 items-center justify-end gap-1',
                        compact ? 'w-8' : 'w-10 sm:w-auto',
                    )}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'rounded-full',
                            compact ? 'size-7' : 'size-8 sm:size-9',
                        )}
                        aria-label="Bulan berikutnya"
                        onClick={handleNextMonth}
                    >
                        <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                </div>
            </header>

            <div
                role="row"
                className={cn(
                    'grid grid-cols-7',
                    compact ? 'mb-1 gap-0.5' : 'mb-2 gap-1 sm:mb-4 sm:gap-2',
                )}
            >
                {DAYS_OF_WEEK.map((day) => (
                    <div
                        key={day.short}
                        role="columnheader"
                        aria-label={day.full}
                        title={day.full}
                        className={cn(
                            'flex items-center justify-center font-medium tracking-wider text-muted-foreground uppercase',
                            compact
                                ? 'h-5 text-[9px]'
                                : 'h-6 text-[10px] sm:h-8 sm:text-xs',
                        )}
                    >
                        <span className="truncate">{day.short}</span>
                    </div>
                ))}
            </div>

            {calendarDays.length > 0 ? (
                <div
                    role="grid"
                    aria-label={`Kalender ${scheduleMonthName(currentMonth)} ${currentYear}`}
                    className="grid auto-rows-fr grid-cols-7 gap-1 sm:gap-2"
                >
                    {Array.from({ length: firstDayOffset }).map((_, index) => (
                        <div
                            key={`empty-${index}`}
                            aria-hidden="true"
                            className={cn(
                                'bg-transparent',
                                compact
                                    ? 'min-h-12 sm:min-h-14 md:min-h-16'
                                    : 'min-h-16 sm:min-h-20 md:min-h-24',
                            )}
                        />
                    ))}

                    {calendarDays.map((day) => {
                        const eventLabel = `${day.schedules_count} acara`;
                        const isFull =
                            maxOrdersPerDay !== undefined &&
                            day.schedules_count >= maxOrdersPerDay;
                        const isDisabled = isDayDisabled?.(day) ?? false;
                        const ariaLabel = [
                            day.label,
                            showEventBadge ? eventLabel : undefined,
                            isFull ? 'Penuh' : undefined,
                        ]
                            .filter(Boolean)
                            .join(', ');

                        return (
                            <button
                                key={day.id}
                                type="button"
                                role="gridcell"
                                aria-label={ariaLabel}
                                aria-current={day.is_today ? 'date' : undefined}
                                aria-pressed={day.is_selected}
                                disabled={isDisabled}
                                onClick={() => handleDayClick(day.date)}
                                className={cn(
                                    'group relative flex min-w-0 flex-col items-center bg-transparent transition-all duration-200',
                                    compact
                                        ? 'min-h-12 rounded-lg p-0.5 sm:min-h-14 sm:rounded-xl sm:p-1 md:min-h-16'
                                        : 'min-h-16 rounded-xl p-1 sm:min-h-20 sm:rounded-2xl sm:p-2 md:min-h-24',
                                    'hover:bg-muted/40 focus-visible:z-10 focus-visible:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                                    day.is_selected &&
                                        'bg-primary/5 hover:bg-primary/5',
                                    isFull &&
                                        'text-destructive hover:bg-destructive/15',
                                    isDisabled &&
                                        'cursor-not-allowed opacity-60 hover:bg-transparent',
                                )}
                            >
                                <div className="flex-1" />

                                <span
                                    className={cn(
                                        'flex shrink-0 items-center justify-center rounded-full font-medium tabular-nums transition-colors',
                                        compact
                                            ? 'h-6 min-w-6 text-xs sm:h-7 sm:min-w-7 sm:text-sm md:h-8 md:min-w-8 md:text-base'
                                            : 'h-7 min-w-7 text-sm sm:h-9 sm:min-w-9 sm:text-base md:text-lg',
                                        isFull
                                            ? 'bg-destructive font-semibold text-white shadow-sm'
                                            : day.is_selected
                                              ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                                              : day.is_today
                                                ? 'bg-primary/10 font-bold text-primary ring-1 ring-primary/30'
                                                : 'text-foreground/70 group-hover:text-foreground',
                                    )}
                                >
                                    {day.day_number}
                                </span>

                                <div className="flex w-full flex-1 items-end justify-center pb-0.5 sm:pb-1">
                                    {showEventBadge &&
                                        day.schedules_count > 0 && (
                                            <div
                                                className={cn(
                                                    'flex items-center gap-1.5 transition-colors',
                                                    isFull
                                                        ? 'text-destructive'
                                                        : 'text-muted-foreground group-hover:text-foreground',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'h-1.5 w-1.5 shrink-0 rounded-full',
                                                        isFull
                                                            ? 'bg-destructive'
                                                            : day.is_selected
                                                              ? 'bg-primary'
                                                              : 'bg-primary/70 group-hover:bg-primary',
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        'truncate text-[10px] leading-none font-medium sm:text-xs',
                                                        isFull
                                                            ? 'font-semibold text-destructive'
                                                            : day.is_selected &&
                                                                  'font-semibold text-primary',
                                                    )}
                                                >
                                                    <span className="sm:hidden">
                                                        {day.schedules_count}
                                                    </span>
                                                    <span className="hidden sm:inline">
                                                        {eventLabel}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                    Data kalender tidak tersedia.
                </div>
            )}
        </section>
    );
}
