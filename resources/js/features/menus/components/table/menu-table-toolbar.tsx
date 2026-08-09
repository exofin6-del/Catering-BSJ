import { Search } from 'lucide-react';

import { DataTableFilterChipGroup } from '@/components/data-table';
import type { DataTableFilterChipOption } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MenuCategory } from '@/types';

import type { MenuFilters } from '../../types/menu-types';

type FilterPatch = {
    categoryId?: number | null;
    page?: number;
    promo?: MenuFilters['promo'];
    recommended?: MenuFilters['recommended'];
    search?: string;
    sortBy?: MenuFilters['sort_by'];
    sortDir?: MenuFilters['sort_dir'];
    status?: MenuFilters['status'];
};

type MenuTableToolbarProps = {
    categories: MenuCategory[];
    className?: string;
    filters: MenuFilters;
    search: string;
    searchPlaceholder?: string;
    showStatus?: boolean;
    variant?: 'card' | 'inline';
    onFilterChange: (filters: FilterPatch) => void;
    onFilterPrefetch?: (filters: FilterPatch) => void;
    onSearchChange?: (search: string) => void;
};

const statusOptions: {
    label: string;
    value: MenuFilters['status'];
}[] = [
    { label: 'Aktif', value: 'active' },
    { label: 'Nonaktif', value: 'inactive' },
];

const recommendedOptions: {
    label: string;
    value: MenuFilters['recommended'];
}[] = [{ label: 'Rekomendasi', value: 'yes' }];

const promoOptions: {
    label: string;
    value: MenuFilters['promo'];
}[] = [{ label: 'Promo', value: 'yes' }];

export function MenuTableToolbar({
    categories,
    className,
    filters,
    search,
    searchPlaceholder = 'Cari menu...',
    showStatus = true,
    variant = 'inline',
    onFilterChange,
    onFilterPrefetch,
    onSearchChange,
}: MenuTableToolbarProps) {
    const hasActiveChipFilters =
        filters.category_id !== null ||
        filters.status !== 'all' ||
        filters.recommended !== 'all' ||
        filters.promo !== 'all' ||
        filters.sort_by !== 'manual' ||
        filters.sort_dir !== 'asc';

    function updateFilters(patch: FilterPatch): void {
        onFilterChange({
            page: 1,
            search,
            ...patch,
        });
    }

    function changeSearch(value: string): void {
        onSearchChange?.(value);

        if (value === '') {
            onFilterChange({
                page: 1,
                search: '',
            });
        }
    }

    function resetChipFilters(): void {
        onFilterChange({
            categoryId: null,
            page: 1,
            promo: 'all',
            recommended: 'all',
            search: '',
            sortBy: 'manual',
            sortDir: 'asc',
            status: 'all',
        });
    }

    const quickFilterOptions: DataTableFilterChipOption[] = [
        {
            id: 'all',
            label: 'Semua',
            selected: !hasActiveChipFilters,
            onPrefetch: () =>
                prefetchFilters({
                    categoryId: null,
                    promo: 'all',
                    recommended: 'all',
                    sortBy: 'manual',
                    sortDir: 'asc',
                    status: 'all',
                }),
            onSelect: resetChipFilters,
        },
        ...statusOptions.map((option) => ({
            id: `status-${option.value}`,
            label: option.label,
            selected: filters.status === option.value,
            onPrefetch: () =>
                prefetchFilters({
                    status: option.value,
                }),
            onSelect: () =>
                updateFilters({
                    status:
                        filters.status === option.value ? 'all' : option.value,
                }),
        })),
    ];

    quickFilterOptions.push(
        ...promoOptions.map((option) => ({
            id: `promo-${option.value}`,
            label: option.label,
            selected: filters.promo === option.value,
            onPrefetch: () =>
                prefetchFilters({
                    promo: option.value,
                }),
            onSelect: () =>
                updateFilters({
                    promo:
                        filters.promo === option.value ? 'all' : option.value,
                }),
        })),
    );

    quickFilterOptions.push(
        ...recommendedOptions.map((option) => ({
            id: `recommended-${option.value}`,
            label: option.label,
            selected: filters.recommended === option.value,
            onPrefetch: () =>
                prefetchFilters({
                    recommended: option.value,
                }),
            onSelect: () =>
                updateFilters({
                    recommended:
                        filters.recommended === option.value
                            ? 'all'
                            : option.value,
                }),
        })),
    );

    quickFilterOptions.push(
        ...categories.map((category) => ({
            id: `category-${category.id}`,
            label: category.name,
            selected: filters.category_id === category.id,
            onPrefetch: () =>
                prefetchFilters({
                    categoryId: category.id,
                }),
            onSelect: () =>
                updateFilters({
                    categoryId:
                        filters.category_id === category.id
                            ? null
                            : category.id,
                }),
        })),
    );

    function prefetchFilters(patch: FilterPatch): void {
        onFilterPrefetch?.({
            page: 1,
            search,
            ...patch,
        });
    }

    const content = (
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 lg:w-72 lg:shrink-0">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        placeholder={searchPlaceholder}
                        onChange={(event) => changeSearch(event.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {showStatus ? (
                <DataTableFilterChipGroup
                    label="Filter menu"
                    options={quickFilterOptions}
                    showLabel={false}
                    wrap={false}
                    className="min-w-0 flex-1 lg:justify-end"
                    chipsClassName="lg:justify-end"
                />
            ) : null}
        </div>
    );

    if (variant === 'card') {
        return (
            <div
                className={cn(
                    'rounded-md border bg-background p-3 shadow-xs',
                    className,
                )}
            >
                {content}
            </div>
        );
    }

    return <div className={cn('min-w-0', className)}>{content}</div>;
}
