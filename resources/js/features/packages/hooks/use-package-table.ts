import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { RowReorderContext } from '@/components/data-table';
import paket from '@/routes/paket';
import type { MenuPackage } from '@/types';

import type {
    PackageFilters,
    PackageIndexProps,
    PackageIndexStats,
    PaginatedData,
} from '../types/package-types';
import {
    buildPackageIndexQuery,
    cachePackageIndexTableSnapshot,
    canReorderPackageIndex,
    flushPackageIndexTableCache,
    getCachedPackageIndexTableSnapshot,
    packageIndexCacheFor,
    packageIndexCacheTag,
    packageIndexPartialProps,
    packageIndexTablePartialProps,
} from '../utils/package-table';

type PackageIndexVisitFilters = {
    categoryId?: number | null;
    page?: number;
    perPage?: number;
    promo?: PackageFilters['promo'];
    recommended?: PackageFilters['recommended'];
    search?: string;
    sortBy?: PackageFilters['sort_by'];
    sortDir?: PackageFilters['sort_dir'];
    status?: PackageFilters['status'];
};

type UsePackageTableProps = {
    activityItems: MenuPackage[];
    filters: PackageFilters;
    items: PaginatedData<MenuPackage>;
    stats?: PackageIndexStats;
};

const slowIndexRequestSkeletonDelayMs = 450;

export function usePackageTable({
    activityItems,
    filters,
    items,
    stats,
}: UsePackageTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<MenuPackage | null>(null);
    const [displayFilters, setDisplayFilters] = useState(filters);
    const [isIndexVisitPending, setIsIndexVisitPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const activeIndexVisits = useRef(0);
    const loadingTimerId = useRef<number | null>(null);
    const canReorderCurrentPage = canReorderPackageIndex(displayFilters);
    const flushIndexCaches = useCallback(() => {
        flushPackageIndexTableCache();
        router.flushByCacheTags(packageIndexCacheTag);
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
        (nextFilters: PackageIndexVisitFilters) => {
            const currentFilters = displayFilters;
            const nextCategoryId =
                'categoryId' in nextFilters
                    ? (nextFilters.categoryId ?? null)
                    : currentFilters.category_id;
            const nextSearch = nextFilters.search ?? currentFilters.search;
            const nextPerPage = nextFilters.perPage ?? currentFilters.per_page;
            const nextPage = nextFilters.page ?? items.current_page;
            const nextPromo = nextFilters.promo ?? currentFilters.promo;
            const nextRecommended =
                nextFilters.recommended ?? currentFilters.recommended;
            const nextSortBy = nextFilters.sortBy ?? currentFilters.sort_by;
            const nextSortDir = nextFilters.sortDir ?? currentFilters.sort_dir;
            const nextStatus = nextFilters.status ?? currentFilters.status;

            const nextDisplayFilters: PackageFilters = {
                ...currentFilters,
                category_id: nextCategoryId,
                per_page: nextPerPage,
                promo: nextPromo,
                recommended: nextRecommended,
                search: nextSearch,
                sort_by: nextSortBy,
                sort_dir: nextSortDir,
                status: nextStatus,
            };
            const query = buildPackageIndexQuery({
                categoryId: nextCategoryId,
                page: nextPage,
                perPage: nextPerPage,
                promo: nextPromo,
                recommended: nextRecommended,
                search: nextSearch,
                sortBy: nextSortBy,
                sortDir: nextSortDir,
                status: nextStatus,
            });
            const isPaginationOnlyVisit =
                nextCategoryId === currentFilters.category_id &&
                nextSearch === currentFilters.search &&
                nextPromo === currentFilters.promo &&
                nextRecommended === currentFilters.recommended &&
                nextSortBy === currentFilters.sort_by &&
                nextSortDir === currentFilters.sort_dir &&
                nextStatus === currentFilters.status;

            return {
                isSameVisit:
                    nextCategoryId === currentFilters.category_id &&
                    nextSearch === currentFilters.search &&
                    nextPerPage === currentFilters.per_page &&
                    nextPage === items.current_page &&
                    nextPromo === currentFilters.promo &&
                    nextRecommended === currentFilters.recommended &&
                    nextSortBy === currentFilters.sort_by &&
                    nextSortDir === currentFilters.sort_dir &&
                    nextStatus === currentFilters.status,
                isTableOnlyVisit: isPaginationOnlyVisit,
                nextDisplayFilters,
                partialProps: isPaginationOnlyVisit
                    ? packageIndexTablePartialProps
                    : packageIndexPartialProps,
                query,
            };
        },
        [displayFilters, items.current_page],
    );

    const prefetchIndex = useCallback(
        (nextFilters: PackageIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            if (isIndexVisitPending) {
                return;
            }

            if (
                nextVisit.isTableOnlyVisit &&
                getCachedPackageIndexTableSnapshot(nextVisit.query)
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
                router.getCached(paket.index.url(), visitOptions) ||
                router.getPrefetching(paket.index.url(), visitOptions)
            ) {
                return;
            }

            router.prefetch(paket.index.url(), visitOptions, {
                cacheFor: packageIndexCacheFor,
                cacheTags: packageIndexCacheTag,
            });
        },
        [isIndexVisitPending, resolveIndexVisit],
    );

    const visitIndex = useCallback(
        (nextFilters: PackageIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            const cachedTableSnapshot = nextVisit.isTableOnlyVisit
                ? getCachedPackageIndexTableSnapshot(nextVisit.query)
                : undefined;

            setIsIndexVisitPending(false);

            if (cachedTableSnapshot) {
                setDisplayFilters(cachedTableSnapshot.filters);

                router.replace({
                    url: paket.index.url({ query: nextVisit.query }),
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
                router.getCached(paket.index.url(), visitOptions),
            );

            router.get(paket.index.url(), nextVisit.query, {
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

                    const nextProps = page.props as Partial<PackageIndexProps>;

                    if (!nextProps.filters || !nextProps.items) {
                        return;
                    }

                    cachePackageIndexTableSnapshot(nextVisit.query, {
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
        cachePackageIndexTableSnapshot(
            buildPackageIndexQuery({
                categoryId: filters.category_id,
                page: items.current_page,
                perPage: filters.per_page,
                promo: filters.promo,
                recommended: filters.recommended,
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
            category_id: filters.category_id,
            per_page: filters.per_page,
            per_page_options: filters.per_page_options,
            promo: filters.promo,
            recommended: filters.recommended,
            search: filters.search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
            status: filters.status,
        });
    }, [
        filters.category_id,
        filters.per_page,
        filters.per_page_options,
        filters.promo,
        filters.recommended,
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

    const handleReorder = useCallback(
        (nextItems: MenuPackage[], context: RowReorderContext<MenuPackage>) => {
            if (
                context.movedItem?.id === undefined ||
                context.targetItem?.sort_order === undefined
            ) {
                return;
            }

            flushIndexCaches();

            router
                .optimistic<PackageIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(paket.reorder(), {
                    data: {
                        moved_id: context.movedItem.id,
                        target_sort_order: context.targetItem.sort_order,
                    },
                    method: 'post',
                    only: ['items'],
                    preserveScroll: true,
                    preserveState: true,
                });
        },
        [flushIndexCaches, items],
    );

    const handleMove = useCallback(
        (item: MenuPackage, direction: 'up' | 'down') => {
            if (item.id === undefined) {
                return;
            }

            const currentIndex = items.data.findIndex(
                (currentItem) => currentItem.id === item.id,
            );
            const targetIndex =
                direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            const targetItem = items.data[targetIndex];

            if (
                currentIndex < 0 ||
                !targetItem ||
                targetItem.sort_order === undefined
            ) {
                return;
            }

            const nextItems = [...items.data];
            nextItems.splice(currentIndex, 1);
            nextItems.splice(targetIndex, 0, item);

            flushIndexCaches();

            router
                .optimistic<PackageIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(paket.reorder(), {
                    data: {
                        moved_id: item.id,
                        target_sort_order: targetItem.sort_order,
                    },
                    method: 'post',
                    only: ['items'],
                    preserveScroll: true,
                    preserveState: true,
                });
        },
        [flushIndexCaches, items],
    );

    const handleDeleteRequest = useCallback((item: MenuPackage) => {
        setDeleteTarget(item);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (deleteTarget?.id === undefined) {
            setDeleteTarget(null);

            return;
        }

        flushIndexCaches();

        router.delete(paket.destroy.url(deleteTarget.id), {
            onFinish: () => setDeleteTarget(null),
            only: ['items', 'stats', 'activityItems', 'topOrderedPackages'],
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                toast.success('Paket berhasil dihapus.');
            },
        });
    }, [deleteTarget, flushIndexCaches]);

    const handleActiveChange = useCallback(
        (item: MenuPackage, isActive: boolean) => {
            const currentIsActive = Boolean(item.is_active);

            if (item.id === undefined || currentIsActive === isActive) {
                return;
            }

            const activeDelta = isActive ? 1 : -1;

            flushIndexCaches();

            router
                .optimistic<PackageIndexProps>(() => ({
                    activityItems: activityItems.map((activityItem) =>
                        activityItem.id === item.id
                            ? { ...activityItem, is_active: isActive }
                            : activityItem,
                    ),
                    items: {
                        ...items,
                        data: items.data.map((currentItem) =>
                            currentItem.id === item.id
                                ? { ...currentItem, is_active: isActive }
                                : currentItem,
                        ),
                    },
                    stats: stats
                        ? {
                              ...stats,
                              active: Math.max(0, stats.active + activeDelta),
                          }
                        : stats,
                }))
                .visit(paket.status(item.id), {
                    data: {
                        is_active: isActive,
                    },
                    method: 'patch',
                    only: [
                        'items',
                        'stats',
                        'activityItems',
                        'topOrderedPackages',
                    ],
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success(
                            isActive
                                ? 'Paket berhasil diaktifkan.'
                                : 'Paket berhasil dinonaktifkan.',
                        );
                    },
                });
        },
        [activityItems, flushIndexCaches, items, stats],
    );

    return {
        canReorderCurrentPage,
        deleteTarget,
        displayFilters,
        handleActiveChange,
        handleDeleteConfirm,
        handleDeleteRequest,
        handleMove,
        handleReorder,
        isLoading,
        prefetchIndex,
        search,
        setDeleteTarget,
        setSearch,
        visitIndex,
    };
}
