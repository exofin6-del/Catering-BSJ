import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
    Carousel,
    CarouselContent,
    useCarousel,
} from '@/components/ui/carousel';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export type DataTableFilterChip = {
    id: string;
    label: string;
    value?: string;
    onRemove: () => void;
};

type DataTableFilterChipsProps = {
    chips: DataTableFilterChip[];
    className?: string;
    clearLabel?: string;
    onClear?: () => void;
};

export function DataTableFilterChips({
    chips,
    className,
    clearLabel = 'Reset',
    onClear,
}: DataTableFilterChipsProps) {
    if (chips.length === 0) {
        return null;
    }

    return (
        <DataTableFilterChipCarousel className={className}>
            {chips.map((chip) => (
                <div key={chip.id} className="shrink-0 pl-1.5">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 max-w-52 shrink-0 rounded-full px-2.5 text-xs"
                        onClick={chip.onRemove}
                    >
                        <span className="min-w-0 truncate">
                            {chip.label}
                            {chip.value ? (
                                <span className="text-muted-foreground">
                                    : {chip.value}
                                </span>
                            ) : null}
                        </span>
                        <X className="size-3.5" />
                    </Button>
                </div>
            ))}

            {onClear ? (
                <div className="shrink-0 pl-1.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 rounded-full px-2.5 text-xs"
                        onClick={onClear}
                    >
                        {clearLabel}
                    </Button>
                </div>
            ) : null}
        </DataTableFilterChipCarousel>
    );
}

export type DataTableFilterChipOption = {
    id: string;
    icon?: ReactNode;
    label: string;
    selected?: boolean;
    onPrefetch?: () => void;
    onSelect: () => void;
};

type DataTableFilterChipGroupProps = {
    label: string;
    options: DataTableFilterChipOption[];
    chipClassName?: string;
    chipsClassName?: string;
    className?: string;
    showLabel?: boolean;
    wrap?: boolean;
};

export function DataTableFilterChipGroup({
    label,
    options,
    chipClassName,
    chipsClassName,
    className,
    showLabel = true,
    wrap = true,
}: DataTableFilterChipGroupProps) {
    const labelId = useId();
    const selectedValues = options
        .filter((option) => option.selected)
        .map((option) => option.id);

    if (options.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center',
                className,
            )}
        >
            <span
                id={labelId}
                className={cn(
                    'shrink-0 text-xs font-medium text-muted-foreground sm:w-24',
                    !showLabel && 'sr-only',
                )}
            >
                {label}
            </span>

            {wrap ? (
                <ToggleGroup
                    type="multiple"
                    value={selectedValues}
                    aria-labelledby={labelId}
                    variant="outline"
                    size="sm"
                    className={cn(
                        'min-w-0 flex-wrap gap-1.5 rounded-none data-[variant=outline]:shadow-none',
                        chipsClassName,
                    )}
                >
                    {options.map((option) => (
                        <ToggleGroupItem
                            key={option.id}
                            value={option.id}
                            className={cn(
                                dataTableFilterChipItemClassName,
                                chipClassName,
                            )}
                            onClick={option.onSelect}
                            onFocus={option.onPrefetch}
                            onMouseEnter={option.onPrefetch}
                        >
                            {option.icon}
                            {option.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            ) : (
                <ToggleGroup
                    type="multiple"
                    value={selectedValues}
                    aria-labelledby={labelId}
                    variant="outline"
                    size="sm"
                    className={cn(
                        'w-full min-w-0 rounded-none data-[variant=outline]:shadow-none lg:w-auto lg:max-w-full',
                        chipsClassName,
                    )}
                >
                    <DataTableFilterChipCarousel>
                        {options.map((option) => (
                            <div key={option.id} className="shrink-0 pl-1.5">
                                <ToggleGroupItem
                                    value={option.id}
                                    className={cn(
                                        dataTableFilterChipItemClassName,
                                        chipClassName,
                                    )}
                                    onClick={option.onSelect}
                                    onFocus={option.onPrefetch}
                                    onMouseEnter={option.onPrefetch}
                                >
                                    {option.icon}
                                    {option.label}
                                </ToggleGroupItem>
                            </div>
                        ))}
                    </DataTableFilterChipCarousel>
                </ToggleGroup>
            )}
        </div>
    );
}

const dataTableFilterChipItemClassName =
    'h-8 shrink-0 rounded-md border border-input bg-background px-3 text-xs shadow-xs first:rounded-md last:rounded-md data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground data-[variant=outline]:border-l';

type DataTableFilterChipCarouselProps = {
    children: ReactNode;
    className?: string;
};

function DataTableFilterChipCarousel({
    children,
    className,
}: DataTableFilterChipCarouselProps) {
    return (
        <Carousel
            opts={{ dragFree: true, align: 'start' }}
            className={cn('relative w-full min-w-0', className)}
        >
            <DataTableFilterChipCarouselContent>
                {children}
            </DataTableFilterChipCarouselContent>
        </Carousel>
    );
}

function DataTableFilterChipCarouselContent({ children }: { children: ReactNode }) {
    const { canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useCarousel();

    return (
        <div className="relative w-full">
            {/* Left Fade Gradient + Button */}
            <div
                className={cn(
                    'absolute -left-1 top-0 bottom-0 z-10 flex w-16 items-center justify-start bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity duration-300 pointer-events-none',
                    canScrollPrev ? 'opacity-100' : 'opacity-0'
                )}
            >
                {canScrollPrev && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="pointer-events-auto size-7 rounded-full bg-background shadow-md hover:bg-accent hover:text-accent-foreground"
                        onClick={scrollPrev}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="size-4" />
                    </Button>
                )}
            </div>

            {/* Carousel Content viewport */}
            <CarouselContent className="-ml-1.5 flex">
                {children}
            </CarouselContent>

            {/* Right Fade Gradient + Button */}
            <div
                className={cn(
                    'absolute -right-1 top-0 bottom-0 z-10 flex w-16 items-center justify-end bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300 pointer-events-none',
                    canScrollNext ? 'opacity-100' : 'opacity-0'
                )}
            >
                {canScrollNext && (
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="pointer-events-auto size-7 rounded-full bg-background shadow-md hover:bg-accent hover:text-accent-foreground"
                        onClick={scrollNext}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="size-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
