import type { CategoryFilterType, CategoryRecord } from '@/types';

import type {
    CategoryFilterOption,
    CategoryFilters,
    CategoryIndexProps,
    PaginatedData,
} from '../types/category-types';

const categoryIndexCacheForValue = '30s';
const categoryIndexCacheTagValue = 'categories:index';

export type CategoryIndexQuery = Record<string, number | string>;

type CategoryIndexTableCacheEntry = {
    filters: CategoryFilters;
    items: PaginatedData<CategoryRecord>;
};

const categoryIndexTableCache = new Map<string, CategoryIndexTableCacheEntry>();

export const defaultCategoryIndexItems: PaginatedData<CategoryRecord> = {
    current_page: 1,
    data: [],
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
};

export const defaultCategoryIndexFilters: CategoryFilters = {
    category_id: null,
    per_page: 10,
    per_page_options: [10, 25, 50, 100],
    search: '',
    type: 'all',
};

export const defaultCategoryIndexCategoryOptions: CategoryFilterOption[] = [];

export const categoryIndexPartialProps = [
    'category_options',
    'items',
    'filters',
] satisfies (keyof CategoryIndexProps)[];

export const categoryIndexTablePartialProps = [
    'items',
    'filters',
] satisfies (keyof CategoryIndexProps)[];

export const categoryIndexCacheTag = categoryIndexCacheTagValue;
export const categoryIndexCacheFor = categoryIndexCacheForValue;

export function categoryIndexQueryCacheKey(query: CategoryIndexQuery): string {
    return Object.entries(query)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
}

export function cacheCategoryIndexTableSnapshot(
    query: CategoryIndexQuery,
    snapshot: CategoryIndexTableCacheEntry,
): void {
    categoryIndexTableCache.set(categoryIndexQueryCacheKey(query), snapshot);
}

export function getCachedCategoryIndexTableSnapshot(
    query: CategoryIndexQuery,
): CategoryIndexTableCacheEntry | undefined {
    return categoryIndexTableCache.get(categoryIndexQueryCacheKey(query));
}

export function flushCategoryIndexTableCache(): void {
    categoryIndexTableCache.clear();
}

export function buildCategoryIndexQuery({
    categoryId,
    page,
    perPage,
    search,
    type,
}: {
    categoryId: number | null;
    page: number;
    perPage: number;
    search: string;
    type: CategoryFilterType;
}): Record<string, number | string> {
    const query: Record<string, number | string> = {
        per_page: perPage,
    };

    if (page > 1) {
        query.page = page;
    }

    if (search.trim() !== '') {
        query.search = search.trim();
    }

    if (type !== 'all') {
        query.type = type;
    }

    if (type !== 'all' && categoryId !== null) {
        query.category_id = categoryId;
    }

    return query;
}

export function canReorderCategoryIndex(filters: CategoryFilters): boolean {
    return (
        filters.category_id === null &&
        filters.search === '' &&
        filters.type !== 'all'
    );
}
