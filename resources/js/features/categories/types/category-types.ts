import type { ReactNode } from 'react';

import type { RowReorderContext } from '@/components/data-table';
import type { CategoryFilterType, CategoryRecord, CategoryType } from '@/types';

export type PaginatedData<T> = {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

export type CategoryFilters = {
    category_id: number | null;
    per_page: number;
    per_page_options: number[];
    search: string;
    type: CategoryFilterType;
};

export type CategoryFilterOption = {
    id: number;
    name: string;
    type: CategoryType;
};

export type CategoryIndexProps = {
    category_options?: CategoryFilterOption[];
    filters?: CategoryFilters;
    items?: PaginatedData<CategoryRecord>;
};

export type CategoryFormProps = {
    category?: CategoryRecord | null;
    initialType?: CategoryType;
    mode: 'create' | 'edit';
};

export type CategoryTableProps = {
    appendLoadingRowCount?: number;
    categories: CategoryRecord[];
    filters: CategoryFilters;
    isLoading?: boolean;
    canMove?: boolean;
    onActiveChange?: (category: CategoryRecord, isActive: boolean) => void;
    onDelete?: (category: CategoryRecord) => void;
    onEdit?: (category: CategoryRecord) => void;
    onMove?: (category: CategoryRecord, direction: 'up' | 'down') => void;
    onReorder?: (
        nextItems: CategoryRecord[],
        context: RowReorderContext<CategoryRecord>,
    ) => void;
    onFilterChange?: (nextFilters: {
        categoryId?: number | null;
        page?: number;
        perPage?: number;
        search?: string;
        type?: CategoryFilterType;
    }) => void;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSearchChange?: (value: string) => void;
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    searchValue?: string;
    showSearch?: boolean;
    totalItems?: number;
    toolbar?: ReactNode;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
};
