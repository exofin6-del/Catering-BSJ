import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const MOBILE_BREAKPOINT = 640; // sesuaikan dengan breakpoint `sm` Tailwind

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(
            `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
        );
        const onChange = () => setIsMobile(mql.matches);

        onChange();
        mql.addEventListener('change', onChange);

        return () => mql.removeEventListener('change', onChange);
    }, []);

    return isMobile;
}

type ReportDateRangePickerProps = {
    align?: 'center' | 'end' | 'start';
    className?: string;
    endDate: string;
    isActive?: boolean;
    numberOfMonths?: number;
    onChange: (range: {
        endDate: string;
        isComplete: boolean;
        startDate: string;
    }) => void;
    side?: 'top' | 'right' | 'bottom' | 'left';
    startDate: string;
    statusText?: string;
    trigger?: ReactNode;
};

export function ReportDateRangePicker({
    align = 'center',
    className,
    endDate,
    isActive = false,
    numberOfMonths = 2,
    onChange,
    side = 'bottom',
    startDate,
    statusText,
    trigger,
}: ReportDateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();
    const selectedRange: DateRange | undefined = {
        from: parseDateValue(startDate),
        to: parseDateValue(endDate),
    };
    const today = new Date();
    const currentYear = today.getFullYear();

    // Di mobile, paksa 1 bulan & center align supaya nggak overflow viewport/drawer
    const effectiveNumberOfMonths = isMobile ? 1 : numberOfMonths;
    const effectiveAlign = isMobile ? 'center' : align;

    function handleSelect(range: DateRange | undefined) {
        const nextStartDate = formatDateValue(range?.from) ?? '';
        const nextEndDate = formatDateValue(range?.to) ?? '';
        const isComplete = Boolean(nextStartDate && nextEndDate);

        onChange({
            endDate: nextEndDate,
            isComplete,
            startDate: nextStartDate,
        });

        if (isComplete) {
            setOpen(false);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger ?? (
                    <Button
                        aria-expanded={open}
                        className={cn(
                            'h-auto min-h-8 min-w-0 flex-1 items-center justify-start gap-2 px-3 text-left text-xs font-normal whitespace-normal',
                            isActive &&
                                'bg-primary/10 text-primary hover:bg-primary/15',
                            className,
                        )}
                        variant="outline"
                    >
                        <CalendarDays className="size-4 shrink-0" />
                        <span className="min-w-0 break-words whitespace-normal">
                            {formatRangeDisplay(selectedRange)}
                        </span>
                        {statusText ? (
                            <span className="ml-auto shrink-0 text-right text-sm text-muted-foreground">
                                {statusText}
                            </span>
                        ) : null}
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent
                align={effectiveAlign}
                side={side}
                sideOffset={8}
                collisionPadding={16}
                className="w-auto max-w-[90vw] min-w-[18rem] p-0"
            >
                <Calendar
                    className="mx-auto w-full sm:w-auto"
                    captionLayout="dropdown"
                    defaultMonth={selectedRange?.from ?? today}
                    fromYear={currentYear - 3}
                    locale={id}
                    mode="range"
                    numberOfMonths={effectiveNumberOfMonths}
                    selected={selectedRange}
                    showOutsideDays={false}
                    toYear={currentYear + 3}
                    onSelect={handleSelect}
                />
            </PopoverContent>
        </Popover>
    );
}

function formatRangeDisplay(range: DateRange | undefined): string {
    if (!range?.from) {
        return 'Pilih rentang tanggal';
    }

    const from = formatDisplayDate(range.from);

    if (!range.to) {
        return `${from} - Pilih tanggal akhir`;
    }

    if (formatDateValue(range.from) === formatDateValue(range.to)) {
        return from;
    }

    return `${from} - ${formatDisplayDate(range.to)}`;
}

function formatDisplayDate(date: Date): string {
    return format(date, 'dd MMM yyyy', { locale: id });
}

function formatDateValue(date?: Date): string | null {
    return date ? format(date, 'yyyy-MM-dd') : null;
}

function parseDateValue(value?: string | null): Date | undefined {
    if (!value) {
        return undefined;
    }

    const [year, month, day] = value.split('-').map(Number);

    if (!year || !month || !day) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}
