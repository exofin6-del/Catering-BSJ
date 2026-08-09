import { Search } from 'lucide-react';

import { DataTableFilterChipGroup } from '@/components/data-table';
import type { DataTableFilterChipOption } from '@/components/data-table';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CategoryFilterType } from '@/types';

import type {
    CategoryFilterOption,
    CategoryFilters,
} from '../../types/category-types';

type FilterPatch = {
    categoryId?: number | null;
    page?: number;
    perPage?: number;
    search?: string;
    type?: CategoryFilterType;
};

type CategoryTableToolbarProps = {
    categoryOptions?: CategoryFilterOption[];
    className?: string;
    filters: CategoryFilters;
    search: string;
    searchPlaceholder?: string;
    variant?: 'card' | 'inline';
    onFilterChange?: (filters: FilterPatch) => void;
    onFilterPrefetch?: (filters: FilterPatch) => void;
    onSearchChange?: (search: string) => void;
};

const typeOptions: { label: string; value: CategoryFilterType }[] = [
    { label: 'Semua', value: 'all' },
    { label: 'Menu', value: 'menu' },
    { label: 'Paket', value: 'paket' },
];

export function CategoryTableToolbar({
    categoryOptions = [],
    className,
    filters,
    search,
    searchPlaceholder = 'Cari kategori...',
    variant = 'inline',
    onFilterChange,
    onFilterPrefetch,
    onSearchChange,
}: CategoryTableToolbarProps) {
    function updateFilters(patch: FilterPatch): void {
        onFilterChange?.({
            page: 1,
            search,
            ...patch,
        });
    }

    function changeSearch(value: string): void {
        onSearchChange?.(value);

        if (value === '') {
            onFilterChange?.({
                page: 1,
                search: '',
            });
        }
    }

    function prefetchFilters(patch: FilterPatch): void {
        onFilterPrefetch?.({
            page: 1,
            search,
            ...patch,
        });
    }

    const quickFilterOptions: DataTableFilterChipOption[] = typeOptions.map(
        (option) => ({
            id: `type-${option.value}`,
            label: option.label,
            selected: filters.type === option.value,
            onPrefetch: () =>
                prefetchFilters({
                    categoryId: null,
                    type: option.value,
                }),
            onSelect: () =>
                updateFilters({
                    categoryId: null,
                    type: option.value,
                }),
        }),
    );

    const categoryFilterOptions: DataTableFilterChipOption[] = [
        {
            id: 'category-all',
            label: 'Semua kategori',
            selected: filters.category_id === null,
            onPrefetch: () =>
                prefetchFilters({
                    categoryId: null,
                }),
            onSelect: () =>
                updateFilters({
                    categoryId: null,
                }),
        },
        ...categoryOptions.map((category) => ({
            id: `category-${category.type}-${category.id}`,
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
    ];
    const shouldShowCategoryFilter =
        filters.type !== 'all' && categoryFilterOptions.length > 1;
    const filterOptions = shouldShowCategoryFilter
        ? [...quickFilterOptions, ...categoryFilterOptions]
        : quickFilterOptions;

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

            <DataTableFilterChipGroup
                label="Filter tipe dan kategori"
                options={filterOptions}
                showLabel={false}
                wrap={false}
                className="min-w-0 lg:flex-1 lg:justify-end"
                chipsClassName="justify-start lg:justify-end"
            />
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
