import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import orderRoute from '@/routes/order';
import type { Order, OrderStatus } from '@/types';

import type {
    OrderFilters,
    OrderIndexProps,
    OrderIndexStats,
    PaginatedData,
} from '../types/order-types';
import {
    buildOrderIndexQuery,
    cacheOrderIndexTableSnapshot,
    flushOrderIndexTableCache,
    getCachedOrderIndexTableSnapshot,
    orderIndexCacheFor,
    orderIndexCacheTag,
    orderIndexPartialProps,
    orderIndexTablePartialProps,
} from '../utils/order-index';

type OrderIndexVisitFilters = {
    eventDateFrom?: string | null;
    eventDateTo?: string | null;
    page?: number;
    paymentStatus?: OrderFilters['payment_status'];
    paymentType?: OrderFilters['payment_type'];
    perPage?: number;
    search?: string;
    sortBy?: OrderFilters['sort_by'];
    sortDir?: OrderFilters['sort_dir'];
    status?: OrderFilters['status'];
};

type UseOrderTableProps = {
    activityItems: Order[];
    filters: OrderFilters;
    items: PaginatedData<Order>;
    stats?: OrderIndexStats;
};

const slowIndexRequestSkeletonDelayMs = 450;

export function useOrderTable({
    activityItems,
    filters,
    items,
    stats,
}: UseOrderTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
    const [displayFilters, setDisplayFilters] = useState(filters);
    const [isIndexVisitPending, setIsIndexVisitPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const activeIndexVisits = useRef(0);
    const loadingTimerId = useRef<number | null>(null);
    const flushIndexCaches = useCallback(() => {
        flushOrderIndexTableCache();
        router.flushByCacheTags(orderIndexCacheTag);
    }, []);

    const clearLoadingTimer = useCallback(() => {
        if (loadingTimerId.current === null) {
            return;
        }

        window.clearTimeout(loadingTimerId.current);
        loadingTimerId.current = null;
    }, []);

    const handleIndexVisitStart = useCallback(() => {
        activeIndexVisits.current += 1;
        clearLoadingTimer();
        loadingTimerId.current = window.setTimeout(() => {
            loadingTimerId.current = null;

            if (activeIndexVisits.current > 0) {
                setIsLoading(true);
            }
        }, slowIndexRequestSkeletonDelayMs);
    }, [clearLoadingTimer]);

    const handleIndexVisitFinish = useCallback(() => {
        activeIndexVisits.current = Math.max(0, activeIndexVisits.current - 1);

        if (activeIndexVisits.current === 0) {
            clearLoadingTimer();
            setIsLoading(false);
        }
    }, [clearLoadingTimer]);

    const resolveIndexVisit = useCallback(
        (nextFilters: OrderIndexVisitFilters) => {
            const currentFilters = displayFilters;
            const nextSearch = nextFilters.search ?? currentFilters.search;
            const nextPerPage = nextFilters.perPage ?? currentFilters.per_page;
            const nextPage = nextFilters.page ?? items.current_page;
            const nextStatus = nextFilters.status ?? currentFilters.status;
            const nextPaymentStatus =
                nextFilters.paymentStatus ?? currentFilters.payment_status;
            const nextPaymentType =
                nextFilters.paymentType ?? currentFilters.payment_type;
            const nextEventDateFrom =
                nextFilters.eventDateFrom ?? currentFilters.event_date_from;
            const nextEventDateTo =
                nextFilters.eventDateTo ?? currentFilters.event_date_to;
            const nextSortBy = nextFilters.sortBy ?? currentFilters.sort_by;
            const nextSortDir = nextFilters.sortDir ?? currentFilters.sort_dir;

            const nextDisplayFilters: OrderFilters = {
                ...currentFilters,
                event_date_from: nextEventDateFrom,
                event_date_to: nextEventDateTo,
                payment_status: nextPaymentStatus,
                payment_type: nextPaymentType,
                per_page: nextPerPage,
                search: nextSearch,
                sort_by: nextSortBy,
                sort_dir: nextSortDir,
                status: nextStatus,
            };
            const query = buildOrderIndexQuery({
                eventDateFrom: nextEventDateFrom,
                eventDateTo: nextEventDateTo,
                page: nextPage,
                paymentStatus: nextPaymentStatus,
                paymentType: nextPaymentType,
                perPage: nextPerPage,
                search: nextSearch,
                sortBy: nextSortBy,
                sortDir: nextSortDir,
                status: nextStatus,
            });
            const isPaginationOnlyVisit =
                nextSearch === currentFilters.search &&
                nextStatus === currentFilters.status &&
                nextPaymentStatus === currentFilters.payment_status &&
                nextPaymentType === currentFilters.payment_type &&
                nextEventDateFrom === currentFilters.event_date_from &&
                nextEventDateTo === currentFilters.event_date_to &&
                nextSortBy === currentFilters.sort_by &&
                nextSortDir === currentFilters.sort_dir;

            return {
                isSameVisit:
                    nextSearch === currentFilters.search &&
                    nextPerPage === currentFilters.per_page &&
                    nextPage === items.current_page &&
                    nextStatus === currentFilters.status &&
                    nextPaymentStatus === currentFilters.payment_status &&
                    nextPaymentType === currentFilters.payment_type &&
                    nextEventDateFrom === currentFilters.event_date_from &&
                    nextEventDateTo === currentFilters.event_date_to &&
                    nextSortBy === currentFilters.sort_by &&
                    nextSortDir === currentFilters.sort_dir,
                isTableOnlyVisit: isPaginationOnlyVisit,
                nextDisplayFilters,
                partialProps: isPaginationOnlyVisit
                    ? orderIndexTablePartialProps
                    : orderIndexPartialProps,
                query,
            };
        },
        [displayFilters, items.current_page],
    );

    const prefetchIndex = useCallback(
        (nextFilters: OrderIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            if (isIndexVisitPending) {
                return;
            }

            if (
                nextVisit.isTableOnlyVisit &&
                getCachedOrderIndexTableSnapshot(nextVisit.query)
            ) {
                return;
            }

            const visitOptions = {
                data: nextVisit.query,
                method: 'get' as const,
                only: nextVisit.partialProps,
                preserveScroll: true,
                preserveState: true,
                replace: true,
            };

            if (
                router.getCached(orderRoute.index.url(), visitOptions) ||
                router.getPrefetching(orderRoute.index.url(), visitOptions)
            ) {
                return;
            }

            router.prefetch(orderRoute.index.url(), visitOptions, {
                cacheFor: orderIndexCacheFor,
                cacheTags: orderIndexCacheTag,
            });
        },
        [isIndexVisitPending, resolveIndexVisit],
    );

    const visitIndex = useCallback(
        (nextFilters: OrderIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            const cachedTableSnapshot = nextVisit.isTableOnlyVisit
                ? getCachedOrderIndexTableSnapshot(nextVisit.query)
                : undefined;

            setIsIndexVisitPending(false);

            if (cachedTableSnapshot) {
                setDisplayFilters(cachedTableSnapshot.filters);

                router.replace({
                    url: orderRoute.index.url({ query: nextVisit.query }),
                    props: (currentProps) => ({
                        ...currentProps,
                        filters: cachedTableSnapshot.filters,
                        items: cachedTableSnapshot.items,
                    }),
                    preserveScroll: true,
                    preserveState: true,
                });

                return;
            }

            setDisplayFilters(nextVisit.nextDisplayFilters);
            setIsIndexVisitPending(true);

            const visitOptions = {
                data: nextVisit.query,
                method: 'get' as const,
                only: nextVisit.partialProps,
                preserveScroll: true,
                preserveState: true,
                replace: true,
            };
            const hasCachedResponse = Boolean(
                router.getCached(orderRoute.index.url(), visitOptions),
            );

            router.get(orderRoute.index.url(), nextVisit.query, {
                only: nextVisit.partialProps,
                onFinish: () => {
                    setIsIndexVisitPending(false);

                    if (!hasCachedResponse) {
                        handleIndexVisitFinish();
                    }
                },
                onStart: hasCachedResponse ? undefined : handleIndexVisitStart,
                onSuccess: (page) => {
                    if (!nextVisit.isTableOnlyVisit) {
                        return;
                    }

                    const nextProps = page.props as Partial<OrderIndexProps>;

                    if (!nextProps.filters || !nextProps.items) {
                        return;
                    }

                    cacheOrderIndexTableSnapshot(nextVisit.query, {
                        filters: nextProps.filters,
                        items: nextProps.items,
                    });
                },
                preserveScroll: true,
                preserveState: true,
                replace: true,
                showProgress: false,
            });
        },
        [handleIndexVisitFinish, handleIndexVisitStart, resolveIndexVisit],
    );

    useEffect(() => {
        return () => {
            clearLoadingTimer();
        };
    }, [clearLoadingTimer]);

    useEffect(() => {
        cacheOrderIndexTableSnapshot(
            buildOrderIndexQuery({
                eventDateFrom: filters.event_date_from,
                eventDateTo: filters.event_date_to,
                page: items.current_page,
                paymentStatus: filters.payment_status,
                paymentType: filters.payment_type,
                perPage: filters.per_page,
                search: filters.search,
                sortBy: filters.sort_by,
                sortDir: filters.sort_dir,
                status: filters.status,
            }),
            {
                filters,
                items,
            },
        );
    }, [filters, items]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSearch(filters.search);
    }, [filters.search]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayFilters({
            event_date_from: filters.event_date_from,
            event_date_to: filters.event_date_to,
            payment_status: filters.payment_status,
            payment_type: filters.payment_type,
            per_page: filters.per_page,
            per_page_options: filters.per_page_options,
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            status: filters.status,
        });
    }, [
        filters.event_date_from,
        filters.event_date_to,
        filters.payment_status,
        filters.payment_type,
        filters.per_page,
        filters.per_page_options,
        filters.search,
        filters.sort_by,
        filters.sort_dir,
        filters.status,
    ]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (search === filters.search) {
                return;
            }

            visitIndex({
                page: 1,
                search,
            });
        }, 350);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [filters.search, search, visitIndex]);

    useEffect(() => {
        const pagesToPrefetch = [items.current_page - 1, items.current_page + 1]
            .filter((page) => page >= 1 && page <= items.last_page)
            .filter((page) => page !== items.current_page);

        if (isIndexVisitPending) {
            return;
        }

        pagesToPrefetch.forEach((page) => {
            prefetchIndex({ page });
        });
    }, [
        isIndexVisitPending,
        items.current_page,
        items.last_page,
        prefetchIndex,
    ]);

    useEffect(() => {
        if (isIndexVisitPending) {
            return;
        }

        displayFilters.per_page_options
            .filter((perPage) => perPage !== displayFilters.per_page)
            .forEach((perPage) => {
                prefetchIndex({
                    page: 1,
                    perPage,
                });
            });
    }, [
        displayFilters.per_page,
        displayFilters.per_page_options,
        isIndexVisitPending,
        prefetchIndex,
    ]);

    const handleStatusChange = useCallback(
        (item: Order, status: OrderStatus) => {
            if (item.status === status) {
                return;
            }

            flushIndexCaches();

            router
                .optimistic<OrderIndexProps>(() => ({
                    activityItems: activityItems.map((activityItem) =>
                        activityItem.id === item.id
                            ? {
                                  ...activityItem,
                                  can_edit: status !== 'completed',
                                  status,
                              }
                            : activityItem,
                    ),
                    items: {
                        ...items,
                        data: items.data.map((currentItem) =>
                            currentItem.id === item.id
                                ? {
                                      ...currentItem,
                                      can_edit: status !== 'completed',
                                      status,
                                  }
                                : currentItem,
                        ),
                    },
                    stats,
                }))
                .visit(orderRoute.status(item.id), {
                    data: { status },
                    method: 'patch',
                    only: orderIndexPartialProps,
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success('Status order berhasil diperbarui.');
                    },
                });
        },
        [activityItems, flushIndexCaches, items, stats],
    );

    const handleDeleteRequest = useCallback((item: Order) => {
        setDeleteTarget(item);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) {
            return;
        }

        flushIndexCaches();

        router.delete(orderRoute.destroy.url(deleteTarget.id), {
            onFinish: () => setDeleteTarget(null),
            only: orderIndexPartialProps,
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Order berhasil dihapus.');
            },
        });
    }, [deleteTarget, flushIndexCaches]);

    return {
        deleteTarget,
        displayFilters,
        handleDeleteConfirm,
        handleDeleteRequest,
        handleStatusChange,
        isLoading,
        prefetchIndex,
        search,
        setDeleteTarget,
        setSearch,
        visitIndex,
    };
}
