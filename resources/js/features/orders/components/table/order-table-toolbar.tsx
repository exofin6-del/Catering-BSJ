import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

import { DataTableFilterChipGroup } from '@/components/data-table';
import type { DataTableFilterChipOption } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ReportDateRangePicker } from '@/features/reports/components/shared/report-date-range-picker';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import { cn } from '@/lib/utils';

import type { OrderFilters } from '../../types/order-types';
import {
    orderPaymentStatusLabels,
    orderPaymentTypeLabels,
    orderStatusLabels,
} from '../../utils/order-format';

export type OrderFilterPatch = {
    eventDateFrom?: string | null;
    eventDateTo?: string | null;
    page?: number;
    paymentStatus?: OrderFilters['payment_status'];
    paymentType?: OrderFilters['payment_type'];
    search?: string;
    sortBy?: OrderFilters['sort_by'];
    sortDir?: OrderFilters['sort_dir'];
    status?: OrderFilters['status'];
};

type OrderAdvancedFilterValues = Pick<
    OrderFilters,
    | 'event_date_from'
    | 'event_date_to'
    | 'payment_status'
    | 'payment_type'
    | 'status'
>;

const emptyAdvancedFilterValues: OrderAdvancedFilterValues = {
    event_date_from: null,
    event_date_to: null,
    payment_status: 'all',
    payment_type: 'all',
    status: 'all',
};

export function OrderTableToolbar({
    className,
    filters,
    onFilterChange,
    onFilterPrefetch,
    onSearchChange,
    search,
    variant = 'toolbar',
}: {
    className?: string;
    filters: OrderFilters;
    onFilterChange: (filters: OrderFilterPatch) => void;
    onFilterPrefetch?: (filters: OrderFilterPatch) => void;
    onSearchChange: (value: string) => void;
    search: string;
    variant?: 'fields' | 'toolbar';
}) {
    function updateFilters(patch: OrderFilterPatch): void {
        onFilterChange({
            page: 1,
            ...patch,
        });
    }

    function prefetchFilters(patch: OrderFilterPatch): void {
        onFilterPrefetch?.({
            page: 1,
            ...patch,
        });
    }

    function resetFilters(): void {
        updateFilters({
            eventDateFrom: null,
            eventDateTo: null,
            paymentStatus: 'all',
            paymentType: 'all',
            status: 'all',
        });
    }

    const advancedFilterValues = getAdvancedFilterValues(filters);
    const activeFilterCount = getActiveFilterCount(advancedFilterValues);
    const quickFilters = quickFilterOptions({
        filters,
        onPrefetch: prefetchFilters,
        onSelect: updateFilters,
        onReset: resetFilters,
    });
    const isMobile = useIsMobile();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState<OrderAdvancedFilterValues>(
        () => getAdvancedFilterValues(filters),
    );

    function handleDrawerOpenChange(nextOpen: boolean): void {
        if (nextOpen) {
            setDraftFilters(getAdvancedFilterValues(filters));
        }

        setDrawerOpen(nextOpen);
    }

    function applyDraftFilters(): void {
        onFilterChange(getAdvancedFilterPatch(draftFilters));
        setDrawerOpen(false);
    }

    function resetDraftFilters(): void {
        setDraftFilters(emptyAdvancedFilterValues);
    }

    if (variant === 'fields') {
        return (
            <OrderAdvancedFilterFields
                className={className}
                values={advancedFilterValues}
                onChange={(values) =>
                    updateFilters(getAdvancedFilterPatch(values))
                }
            />
        );
    }

    return (
        <Drawer
            open={drawerOpen}
            onOpenChange={handleDrawerOpenChange}
            swipeDirection={isMobile ? 'down' : 'right'}
            showSwipeHandle={isMobile}
        >
            <div
                className={cn(
                    'flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between',
                    className,
                )}
            >
                <div className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        aria-label="Cari order"
                        placeholder="Cari order..."
                        className="pl-9"
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <div className="flex min-w-0 items-center gap-2 lg:flex-1 lg:justify-end">
                    <DataTableFilterChipGroup
                        label="Filter order"
                        options={quickFilters}
                        showLabel={false}
                        wrap={false}
                        className="min-w-0 flex-1 lg:flex-none lg:justify-end"
                        chipsClassName="lg:justify-end"
                    />

                    <DrawerTrigger>
                        <Button
                            type="button"
                            variant="outline"
                            aria-label={
                                activeFilterCount > 0
                                    ? `Filter order, ${activeFilterCount} aktif`
                                    : 'Filter order'
                            }
                            className="shrink-0 gap-2"
                        >
                            <SlidersHorizontal className="size-4" />
                            <span className="hidden sm:inline">Filter</span>
                            {activeFilterCount > 0 ? (
                                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                                    {activeFilterCount}
                                </span>
                            ) : null}
                        </Button>
                    </DrawerTrigger>
                </div>
            </div>
            <DrawerContent className="m-0 h-auto max-h-[92dvh] w-full max-w-none rounded-t-3xl rounded-b-none border-x-0 border-b-0 [--drawer-inset:0px] md:m-2 md:h-auto md:max-h-[calc(100dvh-1rem)] md:w-[28rem] md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:[--drawer-inset:--spacing(2)] md:data-[swipe-axis=x]:top-0 md:data-[swipe-axis=x]:bottom-auto">
                {/* Header */}
                <DrawerHeader className="border-b px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="min-w-0">
                            <DrawerTitle className="truncate text-lg font-semibold">
                                Filter order
                            </DrawerTitle>
                            <DrawerDescription className="truncate text-xs">
                                Saring berdasarkan status, pembayaran, dan
                                tanggal acara.
                            </DrawerDescription>
                        </div>
                    </div>
                </DrawerHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    <OrderAdvancedFilterFields
                        showSectionLabels
                        values={draftFilters}
                        onChange={setDraftFilters}
                    />
                </div>

                <DrawerFooter className="border-t bg-muted/30 px-5 py-4">
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={getActiveFilterCount(draftFilters) === 0}
                            onClick={resetDraftFilters}
                        >
                            Bersihkan
                        </Button>
                        <Button type="button" onClick={applyDraftFilters}>
                            Terapkan filter
                        </Button>
                    </div>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}

function OrderAdvancedFilterFields({
    className,
    onChange,
    showSectionLabels = false,
    values,
}: {
    className?: string;
    onChange: (values: OrderAdvancedFilterValues) => void;
    showSectionLabels?: boolean;
    values: OrderAdvancedFilterValues;
}) {
    return (
        <div className={cn('grid gap-6', className)}>
            <div className="grid gap-3">
                {showSectionLabels ? (
                    <p className="text-sm font-medium text-foreground">
                        Status & pembayaran
                    </p>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                    <ToolbarSelect
                        ariaLabel="Status order"
                        value={values.status}
                        options={[
                            { label: 'Status order', value: 'all' },
                            ...Object.entries(orderStatusLabels).map(
                                ([value, label]) => ({ label, value }),
                            ),
                        ]}
                        onValueChange={(value) =>
                            onChange({
                                ...values,
                                status: value as OrderFilters['status'],
                            })
                        }
                    />

                    <ToolbarSelect
                        ariaLabel="Status pembayaran"
                        value={values.payment_status}
                        options={[
                            { label: 'Status pembayaran', value: 'all' },
                            ...Object.entries(orderPaymentStatusLabels).map(
                                ([value, label]) => ({ label, value }),
                            ),
                        ]}
                        onValueChange={(value) =>
                            onChange({
                                ...values,
                                payment_status:
                                    value as OrderFilters['payment_status'],
                            })
                        }
                    />

                    <ToolbarSelect
                        ariaLabel="Tipe pembayaran"
                        className="sm:col-span-2"
                        value={values.payment_type}
                        options={[
                            { label: 'Tipe pembayaran', value: 'all' },
                            ...Object.entries(orderPaymentTypeLabels).map(
                                ([value, label]) => ({ label, value }),
                            ),
                        ]}
                        onValueChange={(value) =>
                            onChange({
                                ...values,
                                payment_type:
                                    value as OrderFilters['payment_type'],
                            })
                        }
                    />
                </div>
            </div>

            <div className="grid gap-3">
                {showSectionLabels ? (
                    <p className="text-sm font-medium text-foreground">
                        Rentang tanggal acara
                    </p>
                ) : null}

                <ReportDateRangePicker
                    align="center"
                    numberOfMonths={2}
                    side="bottom"
                    className="w-full min-w-0 rounded-md border text-xs font-medium"
                    startDate={values.event_date_from ?? ''}
                    endDate={values.event_date_to ?? ''}
                    onChange={({ startDate, endDate }) =>
                        onChange({
                            ...values,
                            event_date_from: startDate || null,
                            event_date_to: endDate || null,
                        })
                    }
                />
            </div>
        </div>
    );
}

function ToolbarSelect({
    ariaLabel,
    className,
    onValueChange,
    options,
    value,
}: {
    ariaLabel: string;
    className?: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
    value: string;
}) {
    return (
        <Select value={value} onValueChange={onValueChange}>
            <SelectTrigger
                aria-label={ariaLabel}
                className={cn('w-full', className)}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function getAdvancedFilterValues(
    filters: OrderFilters,
): OrderAdvancedFilterValues {
    return {
        event_date_from: filters.event_date_from,
        event_date_to: filters.event_date_to,
        payment_status: filters.payment_status,
        payment_type: filters.payment_type,
        status: filters.status,
    };
}

function getAdvancedFilterPatch(
    values: OrderAdvancedFilterValues,
): OrderFilterPatch {
    return {
        eventDateFrom: values.event_date_from,
        eventDateTo: values.event_date_to,
        paymentStatus: values.payment_status,
        paymentType: values.payment_type,
        status: values.status,
    };
}

function getActiveFilterCount(values: OrderAdvancedFilterValues): number {
    return [
        values.status !== 'all',
        values.payment_status !== 'all',
        values.payment_type !== 'all',
        Boolean(values.event_date_from),
        Boolean(values.event_date_to),
    ].filter(Boolean).length;
}

function quickFilterOptions({
    filters,
    onPrefetch,
    onReset,
    onSelect,
}: {
    filters: OrderFilters;
    onPrefetch: (filters: OrderFilterPatch) => void;
    onReset: () => void;
    onSelect: (filters: OrderFilterPatch) => void;
}): DataTableFilterChipOption[] {
    const isAll =
        filters.status === 'all' &&
        filters.payment_status === 'all' &&
        filters.payment_type === 'all' &&
        !filters.event_date_from &&
        !filters.event_date_to;

    return [
        {
            id: 'all',
            label: 'Semua',
            selected: isAll,
            onPrefetch: () =>
                onPrefetch({ paymentStatus: 'all', status: 'all' }),
            onSelect: onReset,
        },
        {
            id: 'pending',
            label: 'Menunggu',
            selected:
                filters.status === 'pending_confirmation' &&
                filters.payment_status === 'all',
            onPrefetch: () =>
                onPrefetch({
                    paymentStatus: 'all',
                    status: 'pending_confirmation',
                }),
            onSelect: () =>
                onSelect({
                    paymentStatus: 'all',
                    status:
                        filters.status === 'pending_confirmation'
                            ? 'all'
                            : 'pending_confirmation',
                }),
        },
        {
            id: 'dp-paid',
            label: 'DP Dibayar',
            selected:
                filters.status === 'all' &&
                filters.payment_status === 'dp_paid',
            onPrefetch: () =>
                onPrefetch({ paymentStatus: 'dp_paid', status: 'all' }),
            onSelect: () =>
                onSelect({
                    paymentStatus:
                        filters.payment_status === 'dp_paid'
                            ? 'all'
                            : 'dp_paid',
                    status: 'all',
                }),
        },
        {
            id: 'paid',
            label: 'Lunas',
            selected:
                filters.status === 'all' && filters.payment_status === 'paid',
            onPrefetch: () =>
                onPrefetch({ paymentStatus: 'paid', status: 'all' }),
            onSelect: () =>
                onSelect({
                    paymentStatus:
                        filters.payment_status === 'paid' ? 'all' : 'paid',
                    status: 'all',
                }),
        },
        {
            id: 'canceled',
            label: 'Dibatalkan',
            selected:
                filters.status === 'canceled' &&
                filters.payment_status === 'all',
            onPrefetch: () =>
                onPrefetch({
                    paymentStatus: 'all',
                    status: 'canceled',
                }),
            onSelect: () =>
                onSelect({
                    paymentStatus: 'all',
                    status: filters.status === 'canceled' ? 'all' : 'canceled',
                }),
        },
    ];
}
