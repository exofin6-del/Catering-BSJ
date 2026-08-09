import {
    eachDayOfInterval,
    endOfMonth,
    format,
    isValid,
    parseISO,
    startOfMonth,
    startOfToday,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays, Clock3 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScheduleCalendarCard } from '@/features/schedules/components/schedule-calendar-card';
import type { ScheduleDay } from '@/features/schedules/types/schedule-types';
import { cn } from '@/lib/utils';
import orderRoute from '@/routes/order';
import {
    clampOrderTime,
    formatOrderTimeInput,
    parseOrderTimeInput,
    resolveOperationalTimeRange,
} from '../../utils/order-schedule-logic';

type CapacityPayload = {
    days: Record<string, number>;
    max_orders_per_day: number;
};

type OrderDatePickerProps = {
    invalid?: boolean;
    onBlur?: () => void;
    onChange: (value: string) => void;
    originalEventDate?: string;
    value: string;
};

type OrderTimePickerProps = {
    endTime?: string;
    invalid?: boolean;
    onBlur?: () => void;
    onChange: (value: string) => void;
    startTime?: string;
    value: string;
};

const defaultCapacity = 3;

function dateFromValue(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const date = parseISO(value);

    return isValid(date) ? date : undefined;
}

export function OrderDatePicker({
    invalid = false,
    onBlur,
    onChange,
    originalEventDate,
    value,
}: OrderDatePickerProps) {
    const today = useMemo(() => startOfToday(), []);
    const selectedDate = dateFromValue(value);
    const [month, setMonth] = useState(
        format(selectedDate ?? today, 'yyyy-MM'),
    );
    const [capacity, setCapacity] = useState<CapacityPayload>({
        days: {},
        max_orders_per_day: defaultCapacity,
    });
    const [hasLoadError, setHasLoadError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();

        async function loadCapacity(): Promise<void> {
            setIsLoading(true);
            setHasLoadError(false);
            setCapacity((current) => ({ ...current, days: {} }));

            try {
                const response = await fetch(
                    orderRoute.calendarCapacity.url({
                        query: { month },
                    }),
                    {
                        headers: { Accept: 'application/json' },
                        signal: abortController.signal,
                    },
                );

                if (!response.ok) {
                    throw new Error('Gagal memuat kapasitas order.');
                }

                setCapacity((await response.json()) as CapacityPayload);
            } catch {
                if (!abortController.signal.aborted) {
                    setHasLoadError(true);
                }
            } finally {
                if (!abortController.signal.aborted) {
                    setIsLoading(false);
                }
            }
        }

        void loadCapacity();

        return () => abortController.abort();
    }, [month]);

    const calendarDays = useMemo<ScheduleDay[]>(() => {
        const monthDate = parseISO(`${month}-01`);

        if (!isValid(monthDate)) {
            return [];
        }

        return eachDayOfInterval({
            start: startOfMonth(monthDate),
            end: endOfMonth(monthDate),
        }).map((date): ScheduleDay => {
            const dateString = format(date, 'yyyy-MM-dd');

            return {
                date: dateString,
                day_name: format(date, 'EEEE', { locale: id }),
                day_number: format(date, 'd'),
                id: dateString,
                is_selected: dateString === value,
                is_today: dateString === format(today, 'yyyy-MM-dd'),
                label: format(date, 'EEE, d MMM yyyy', { locale: id }),
                month_label: format(date, 'MMM', { locale: id }),
                schedules_count: capacity.days[dateString] ?? 0,
            };
        });
    }, [capacity.days, month, today, value]);

    const currentYear = month.slice(0, 4);
    const currentMonth = month.slice(5, 7);
    const todayString = format(today, 'yyyy-MM-dd');

    const isDayDisabled = (day: ScheduleDay): boolean => {
        const isFull =
            day.schedules_count >= capacity.max_orders_per_day &&
            day.date !== originalEventDate;

        return isLoading || hasLoadError || day.date < todayString || isFull;
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);

                if (!open) {
                    onBlur?.();
                }
            }}
        >
            <Button
                id="event_date"
                type="button"
                variant="outline"
                aria-invalid={invalid}
                className={cn(
                    'h-10 w-full justify-start gap-2 px-3 text-left font-normal',
                    !selectedDate && 'text-muted-foreground',
                    invalid && 'border-destructive ring-destructive/20',
                )}
                onClick={() => setIsOpen(true)}
            >
                <CalendarDays className="size-4 shrink-0" />

                <span className="truncate">
                    {selectedDate
                        ? format(selectedDate, 'EEE, d MMM yyyy', {
                              locale: id,
                          })
                        : 'Pilih tanggal'}
                </span>
            </Button>

            <DialogContent
                showCloseButton={false}
                className="w-[calc(100%-1rem)] max-w-none gap-0 rounded-xl border p-0 sm:w-full sm:max-w-lg"
            >
                <ScheduleCalendarCard
                    calendarDays={calendarDays}
                    compact
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    isDayDisabled={isDayDisabled}
                    maxOrdersPerDay={capacity.max_orders_per_day}
                    month={month}
                    onVisit={(query) => {
                        if (query.month) {
                            setMonth(query.month);
                        }

                        if (query.selected_date) {
                            onChange(query.selected_date);
                            setIsOpen(false);
                        }
                    }}
                    className="border-0 p-4 sm:p-5 lg:px-8 lg:py-5"
                    showEventBadge={false}
                />

                <div className="flex min-h-9 items-center border-t px-5 py-2 lg:px-8">
                    {hasLoadError ? (
                        <span className="text-[11px] text-destructive">
                            Kapasitas gagal dimuat. Ganti bulan untuk mencoba
                            lagi.
                        </span>
                    ) : (
                        <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-foreground/70" />
                                Tersedia
                            </span>

                            <span className="flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-destructive/80" />
                                Penuh
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function OrderTimePicker({
    endTime,
    invalid = false,
    onBlur,
    onChange,
    startTime,
    value,
}: OrderTimePickerProps) {
    const { maxTime, minTime } = resolveOperationalTimeRange(
        startTime,
        endTime,
    );
    const [draftInputValue, setDraftInputValue] = useState<string | null>(null);
    const inputValue = draftInputValue ?? formatOrderTimeInput(value);

    const handleInputBlur = (): void => {
        const parsedTime = parseOrderTimeInput(inputValue);
        const normalizedTime = parsedTime
            ? clampOrderTime(parsedTime, minTime, maxTime)
            : '';

        setDraftInputValue(null);
        onChange(normalizedTime);
        onBlur?.();
    };

    return (
        <div>
            <div className="relative">
                <Clock3 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    id="event_time"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={5}
                    placeholder="Contoh: 07:00"
                    value={inputValue}
                    aria-invalid={invalid}
                    className={cn(
                        'h-10 w-full rounded-md border border-input bg-background px-3 pr-10 pl-9 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                        invalid && 'border-destructive ring-destructive/20',
                    )}
                    onChange={(event) => {
                        const nextInputValue = formatOrderTimeInput(
                            event.target.value,
                        );
                        const parsedTime = parseOrderTimeInput(nextInputValue);

                        setDraftInputValue(nextInputValue);

                        if (parsedTime) {
                            const normalizedTime = clampOrderTime(
                                parsedTime,
                                minTime,
                                maxTime,
                            );

                            setDraftInputValue(null);
                            onChange(normalizedTime);
                        }
                    }}
                    onBlur={handleInputBlur}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    WIB
                </span>
            </div>
        </div>
    );
}
