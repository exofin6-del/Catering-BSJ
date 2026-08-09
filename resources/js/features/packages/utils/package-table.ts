import type { MenuPackage } from '@/types';
import type {
    PackageFilters,
    PackageIndexProps,
    PackageIndexStats,
    PackageTopOrderedItem,
    PackageSortValue,
    PaginatedData,
} from '../types/package-types';

export type PackageIndexQuery = Record<string, number | string>;

type PackageIndexTableCacheEntry = {
    filters: PackageFilters;
    items: PaginatedData<MenuPackage>;
};

const packageIndexTableCache = new Map<string, PackageIndexTableCacheEntry>();

export const defaultPackageIndexItems: PaginatedData<MenuPackage> = {
    current_page: 1,
    data: [],
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
};

export const defaultPackageIndexFilters: PackageFilters = {
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

export const defaultPackageIndexStats: PackageIndexStats = {
    active: 0,
    promo: 0,
    recommended: 0,
    total: 0,
};

export const defaultPackageTopOrderedItems: PackageTopOrderedItem[] = [];

export const packageIndexPartialProps = [
    'items',
    'filters',
    'activityItems',
    'stats',
    'packageCategories',
    'topOrderedPackages',
] satisfies (keyof PackageIndexProps)[];

export const packageIndexTablePartialProps = [
    'items',
    'filters',
] satisfies (keyof PackageIndexProps)[];

export const packageIndexCacheTag = 'packages:index';
export const packageIndexCacheFor = '30s';

export function packageIndexQueryCacheKey(query: PackageIndexQuery): string {
    return Object.entries(query)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
}

export function cachePackageIndexTableSnapshot(
    query: PackageIndexQuery,
    snapshot: PackageIndexTableCacheEntry,
): void {
    packageIndexTableCache.set(packageIndexQueryCacheKey(query), snapshot);
}

export function getCachedPackageIndexTableSnapshot(
    query: PackageIndexQuery,
): PackageIndexTableCacheEntry | undefined {
    return packageIndexTableCache.get(packageIndexQueryCacheKey(query));
}

export function flushPackageIndexTableCache(): void {
    packageIndexTableCache.clear();
}

export function canReorderPackageIndex(filters: PackageFilters): boolean {
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

export function buildPackageIndexQuery({
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
    promo: PackageFilters['promo'];
    recommended: PackageFilters['recommended'];
    search: string;
    sortBy: PackageFilters['sort_by'];
    sortDir: PackageFilters['sort_dir'];
    status: PackageFilters['status'];
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

export function packageSortValue(filters: PackageFilters): PackageSortValue {
    if (filters.sort_by === 'manual') {
        return 'manual';
    }

    if (
        filters.sort_by === 'category' ||
        filters.sort_by === 'min_order' ||
        filters.sort_by === 'name' ||
        filters.sort_by === 'price' ||
        filters.sort_by === 'promo' ||
        filters.sort_by === 'recommended' ||
        filters.sort_by === 'status'
    ) {
        return `${filters.sort_by}_${filters.sort_dir}` as PackageSortValue;
    }

    if (filters.sort_by === 'created_at') {
        return `created_at_${filters.sort_dir}` as PackageSortValue;
    }

    return 'updated_at_desc';
}
