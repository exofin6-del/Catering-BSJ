import type { Order } from '@/types';

import type {
    OrderFilters,
    OrderIndexProps,
    PaginatedData,
} from '../types/order-types';

export type OrderIndexQuery = Record<string, number | string>;

type OrderIndexTableCacheEntry = {
    filters: OrderFilters;
    items: PaginatedData<Order>;
};

const orderIndexTableCache = new Map<string, OrderIndexTableCacheEntry>();

export const defaultOrderIndexItems: PaginatedData<Order> = {
    current_page: 1,
    data: [],
    from: null,
    last_page: 1,
    per_page: 10,
    to: null,
    total: 0,
};

export const defaultOrderIndexFilters: OrderFilters = {
    event_date_from: null,
    event_date_to: null,
    payment_status: 'all',
    payment_type: 'all',
    per_page: 10,
    per_page_options: [10, 25, 50, 100],
    search: '',
    sort_by: 'created_at',
    sort_dir: 'desc',
    status: 'all',
};

export const defaultOrderIndexStats = {
    canceled: 0,
    completed: 0,
    confirmed: 0,
    dp_paid: 0,
    paid: 0,
    pending_confirmation: 0,
    total: 0,
    unpaid: 0,
};

export const orderIndexPartialProps = [
    'items',
    'filters',
    'activityItems',
    'stats',
] satisfies (keyof OrderIndexProps)[];

export const orderIndexTablePartialProps = [
    'items',
    'filters',
] satisfies (keyof OrderIndexProps)[];

export const orderIndexCacheTag = 'orders';
export const orderIndexCacheFor = '2m';

export function orderIndexQueryCacheKey(query: OrderIndexQuery): string {
    return Object.entries(query)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
}

export function cacheOrderIndexTableSnapshot(
    query: OrderIndexQuery,
    snapshot: OrderIndexTableCacheEntry,
): void {
    orderIndexTableCache.set(orderIndexQueryCacheKey(query), snapshot);
}

export function getCachedOrderIndexTableSnapshot(
    query: OrderIndexQuery,
): OrderIndexTableCacheEntry | undefined {
    return orderIndexTableCache.get(orderIndexQueryCacheKey(query));
}

export function flushOrderIndexTableCache(): void {
    orderIndexTableCache.clear();
}

export function buildOrderIndexQuery({
    eventDateFrom,
    eventDateTo,
    page,
    paymentStatus,
    paymentType,
    perPage,
    search,
    sortBy,
    sortDir,
    status,
}: {
    eventDateFrom: string | null;
    eventDateTo: string | null;
    page: number;
    paymentStatus: OrderFilters['payment_status'];
    paymentType: OrderFilters['payment_type'];
    perPage: number;
    search: string;
    sortBy: OrderFilters['sort_by'];
    sortDir: OrderFilters['sort_dir'];
    status: OrderFilters['status'];
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

    if (status !== 'all') {
        query.status = status;
    }

    if (paymentStatus !== 'all') {
        query.payment_status = paymentStatus;
    }

    if (paymentType !== 'all') {
        query.payment_type = paymentType;
    }

    if (eventDateFrom) {
        query.event_date_from = eventDateFrom;
    }

    if (eventDateTo) {
        query.event_date_to = eventDateTo;
    }

    if (sortBy !== 'created_at') {
        query.sort_by = sortBy;
    }

    if (sortDir !== 'desc') {
        query.sort_dir = sortDir;
    }

    return query;
}
