import type { MenuItem } from '@/types';
import type {
    MenuFilters,
    MenuIndexProps,
    MenuSortValue,
    PaginatedData,
} from '../types/menu-types';

const menuIndexCacheForValue = '30s';
const menuIndexCacheTagValue = 'menu:index';

export type MenuIndexQuery = Record<string, number | string>;

type MenuIndexTableCacheEntry = {
    filters: MenuFilters;
    items: PaginatedData<MenuItem>;
};

const menuIndexTableCache = new Map<string, MenuIndexTableCacheEntry>();

export const defaultMenuIndexItems: PaginatedData<MenuItem> = {
    current_page: 1,
    data: [],
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
};

export const defaultMenuIndexFilters: MenuFilters = {
    category_id: null,
    per_page: 10,
    per_page_options: [10, 25, 50, 100],
    promo: 'all',
    recommended: 'all',
    search: '',
    sort_by: 'manual',
    sort_dir: 'asc',
    status: 'all',
};

export const menuIndexPartialProps = [
    'items',
    'filters',
    'categories',
    'activityItems',
    'stats',
    'topOrderedItems',
] satisfies (keyof MenuIndexProps)[];

export const menuIndexTablePartialProps = [
    'items',
    'filters',
] satisfies (keyof MenuIndexProps)[];

export const menuIndexCacheTag = menuIndexCacheTagValue;
export const menuIndexCacheFor = menuIndexCacheForValue;

export function menuIndexQueryCacheKey(query: MenuIndexQuery): string {
    return Object.entries(query)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
}

export function cacheMenuIndexTableSnapshot(
    query: MenuIndexQuery,
    snapshot: MenuIndexTableCacheEntry,
): void {
    menuIndexTableCache.set(menuIndexQueryCacheKey(query), snapshot);
}

export function getCachedMenuIndexTableSnapshot(
    query: MenuIndexQuery,
): MenuIndexTableCacheEntry | undefined {
    return menuIndexTableCache.get(menuIndexQueryCacheKey(query));
}

export function flushMenuIndexTableCache(): void {
    menuIndexTableCache.clear();
}

export function canReorderMenuIndex(filters: MenuFilters): boolean {
    return (
        filters.search === '' &&
        filters.category_id === null &&
        filters.status === 'all' &&
        filters.recommended === 'all' &&
        filters.promo === 'all' &&
        filters.sort_by === 'manual' &&
        filters.sort_dir === 'asc'
    );
}

export function buildMenuIndexQuery({
    categoryId,
    page,
    perPage,
    promo,
    recommended,
    search,
    sortBy,
    sortDir,
    status,
}: {
    categoryId: number | null;
    page: number;
    perPage: number;
    promo: MenuFilters['promo'];
    recommended: MenuFilters['recommended'];
    search: string;
    sortBy: MenuFilters['sort_by'];
    sortDir: MenuFilters['sort_dir'];
    status: MenuFilters['status'];
}): Record<string, number | string> {
    const query: Record<string, number | string> = {};

    if (perPage !== defaultMenuIndexFilters.per_page) {
        query.per_page = perPage;
    }

    if (page > 1) {
        query.page = page;
    }

    if (search.trim() !== '') {
        query.search = search.trim();
    }

    if (categoryId !== null) {
        query.category_id = categoryId;
    }

    if (status !== 'all') {
        query.status = status;
    }

    if (recommended !== 'all') {
        query.recommended = recommended;
    }

    if (promo !== 'all') {
        query.promo = promo;
    }

    if (sortBy !== 'manual') {
        query.sort_by = sortBy;
    }

    if (sortDir !== 'asc') {
        query.sort_dir = sortDir;
    }

    return query;
}

export function resizeMenuIndexPage<T>(
    items: PaginatedData<T>,
    perPage: number,
): PaginatedData<T> {
    const data = items.data.slice(0, perPage);
    const lastPage = Math.max(1, Math.ceil(items.total / perPage));
    const currentPage = Math.min(items.current_page, lastPage);
    const from = data.length > 0 ? (currentPage - 1) * perPage + 1 : null;
    const to = from === null ? null : from + data.length - 1;

    return {
        ...items,
        current_page: currentPage,
        data,
        from,
        last_page: lastPage,
        per_page: perPage,
        to,
    };
}

export function menuSortValue(filters: MenuFilters): MenuSortValue {
    if (filters.sort_by === 'manual') {
        return 'manual';
    }

    if (
        filters.sort_by === 'category' ||
        filters.sort_by === 'name' ||
        filters.sort_by === 'min_order' ||
        filters.sort_by === 'price' ||
        filters.sort_by === 'promo' ||
        filters.sort_by === 'recommended' ||
        filters.sort_by === 'status'
    ) {
        return `${filters.sort_by}_${filters.sort_dir}` as MenuSortValue;
    }

    if (filters.sort_by === 'created_at') {
        return `created_at_${filters.sort_dir}` as MenuSortValue;
    }

    return 'updated_at_desc';
}

export function menuSortFromValue(
    value: MenuSortValue,
): Pick<MenuFilters, 'sort_by' | 'sort_dir'> {
    if (value === 'manual') {
        return {
            sort_by: 'manual',
            sort_dir: 'asc',
        };
    }

    if (value === 'updated_at_desc') {
        return {
            sort_by: 'updated_at',
            sort_dir: 'desc',
        };
    }

    const [firstSegment, secondSegment, thirdSegment] = value.split('_');
    const sortBy =
        firstSegment === 'created'
            ? 'created_at'
            : firstSegment === 'min'
              ? 'min_order'
              : firstSegment;
    const sortDir =
        firstSegment === 'created' || firstSegment === 'min'
            ? thirdSegment
            : secondSegment;

    return {
        sort_by: sortBy as MenuFilters['sort_by'],
        sort_dir: sortDir as MenuFilters['sort_dir'],
    };
}
