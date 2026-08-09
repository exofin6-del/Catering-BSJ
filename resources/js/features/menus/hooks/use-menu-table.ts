import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { RowReorderContext } from '@/components/data-table';
import menu from '@/routes/menu';
import type { MenuItem } from '@/types';
import type {
    MenuFilters,
    MenuIndexProps,
    MenuIndexStats,
    PaginatedData,
} from '../types/menu-types';
import {
    buildMenuIndexQuery,
    cacheMenuIndexTableSnapshot,
    canReorderMenuIndex,
    flushMenuIndexTableCache,
    getCachedMenuIndexTableSnapshot,
    menuIndexCacheFor,
    menuIndexCacheTag,
    menuIndexPartialProps,
    menuIndexTablePartialProps,
    resizeMenuIndexPage,
} from '../utils/menu-table';

type MenuIndexVisitFilters = {
    categoryId?: number | null;
    page?: number;
    perPage?: number;
    promo?: MenuFilters['promo'];
    recommended?: MenuFilters['recommended'];
    search?: string;
    sortBy?: MenuFilters['sort_by'];
    sortDir?: MenuFilters['sort_dir'];
    status?: MenuFilters['status'];
};

type UseMenuTableProps = {
    activityItems: MenuItem[];
    filters: MenuFilters;
    items: PaginatedData<MenuItem>;
    stats?: MenuIndexStats;
};

const slowIndexRequestSkeletonDelayMs = 180;
const indexRequestLoadingFallbackMs = 10000;

export function useMenuTable({
    activityItems,
    filters,
    items,
    stats,
}: UseMenuTableProps) {
    const [deleteBlockedTarget, setDeleteBlockedTarget] =
        useState<MenuItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
    const [displayFilters, setDisplayFilters] = useState(filters);
    const [appendLoadingRowCount, setAppendLoadingRowCount] = useState(0);
    const [isIndexVisitPending, setIsIndexVisitPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const currentIndexVisitId = useRef(0);
    const loadingFallbackTimerId = useRef<number | null>(null);
    const loadingTimerId = useRef<number | null>(null);
    const canReorderCurrentPage = canReorderMenuIndex(displayFilters);
    const flushIndexCaches = useCallback(() => {
        flushMenuIndexTableCache();
        router.flushByCacheTags(menuIndexCacheTag);
    }, []);
    const clearLoadingTimer = useCallback(() => {
        if (loadingTimerId.current === null) {
            return;
        }

        window.clearTimeout(loadingTimerId.current);
        loadingTimerId.current = null;
    }, []);
    const clearLoadingFallbackTimer = useCallback(() => {
        if (loadingFallbackTimerId.current === null) {
            return;
        }

        window.clearTimeout(loadingFallbackTimerId.current);
        loadingFallbackTimerId.current = null;
    }, []);
    const resetIndexLoading = useCallback(() => {
        clearLoadingFallbackTimer();
        clearLoadingTimer();
        setAppendLoadingRowCount(0);
        setIsLoading(false);
    }, [clearLoadingFallbackTimer, clearLoadingTimer]);
    const handleIndexVisitStart = useCallback(
        (visitId: number) => {
            if (currentIndexVisitId.current !== visitId) {
                return;
            }

            clearLoadingTimer();
            clearLoadingFallbackTimer();
            loadingTimerId.current = window.setTimeout(() => {
                loadingTimerId.current = null;

                if (currentIndexVisitId.current === visitId) {
                    setIsLoading(true);
                }
            }, slowIndexRequestSkeletonDelayMs);
            loadingFallbackTimerId.current = window.setTimeout(() => {
                if (currentIndexVisitId.current === visitId) {
                    resetIndexLoading();
                }
            }, indexRequestLoadingFallbackMs);
        },
        [clearLoadingFallbackTimer, clearLoadingTimer, resetIndexLoading],
    );
    const handleIndexVisitFinish = useCallback(
        (visitId: number) => {
            if (currentIndexVisitId.current === visitId) {
                resetIndexLoading();
            }
        },
        [resetIndexLoading],
    );

    const resolveIndexVisit = useCallback(
        (nextFilters: MenuIndexVisitFilters) => {
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

            const nextDisplayFilters: MenuFilters = {
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

            const query = buildMenuIndexQuery({
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
            const isAppendingRows =
                isPaginationOnlyVisit &&
                nextPage === items.current_page &&
                nextPerPage > currentFilters.per_page;
            const appendLoadingRowCount = isAppendingRows
                ? Math.max(
                      0,
                      Math.min(nextPerPage, items.total) - items.data.length,
                  )
                : 0;
            const canResolveFromLoadedRows =
                isPaginationOnlyVisit &&
                nextPage === items.current_page &&
                items.current_page === 1 &&
                (nextPerPage <= items.data.length ||
                    items.data.length >= items.total);

            return {
                appendLoadingRowCount,
                canResolveFromLoadedRows,
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
                nextDisplayFilters,
                isAppendingRows,
                isTableOnlyVisit: isPaginationOnlyVisit,
                partialProps: isPaginationOnlyVisit
                    ? menuIndexTablePartialProps
                    : menuIndexPartialProps,
                query,
            };
        },
        [displayFilters, items],
    );

    const prefetchIndex = useCallback(
        (nextFilters: MenuIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            if (isIndexVisitPending) {
                return;
            }

            if (
                nextVisit.isTableOnlyVisit &&
                getCachedMenuIndexTableSnapshot(nextVisit.query)
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
                router.getCached(menu.index.url(), visitOptions) ||
                router.getPrefetching(menu.index.url(), visitOptions)
            ) {
                return;
            }

            router.prefetch(menu.index.url(), visitOptions, {
                cacheFor: menuIndexCacheFor,
                cacheTags: menuIndexCacheTag,
            });
        },
        [isIndexVisitPending, resolveIndexVisit],
    );

    const visitIndex = useCallback(
        (nextFilters: MenuIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            const visitId = currentIndexVisitId.current + 1;
            const cachedTableSnapshot = nextVisit.isTableOnlyVisit
                ? getCachedMenuIndexTableSnapshot(nextVisit.query)
                : undefined;

            currentIndexVisitId.current = visitId;
            router.cancelAll({ prefetch: false });
            resetIndexLoading();
            setIsIndexVisitPending(false);

            if (cachedTableSnapshot) {
                setDisplayFilters(cachedTableSnapshot.filters);

                router.replace({
                    url: menu.index.url({ query: nextVisit.query }),
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

            if (nextVisit.canResolveFromLoadedRows) {
                const resizedItems = resizeMenuIndexPage(
                    items,
                    nextVisit.nextDisplayFilters.per_page,
                );

                setDisplayFilters(nextVisit.nextDisplayFilters);
                cacheMenuIndexTableSnapshot(nextVisit.query, {
                    filters: nextVisit.nextDisplayFilters,
                    items: resizedItems,
                });

                router.replace({
                    url: menu.index.url({ query: nextVisit.query }),
                    props: (currentProps) => ({
                        ...currentProps,
                        filters: nextVisit.nextDisplayFilters,
                        items: resizedItems,
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
                router.getCached(menu.index.url(), visitOptions),
            );
            const shouldRenderLoading =
                !hasCachedResponse &&
                (!nextVisit.isAppendingRows ||
                    nextVisit.appendLoadingRowCount > 0);

            setAppendLoadingRowCount(
                shouldRenderLoading ? nextVisit.appendLoadingRowCount : 0,
            );

            router.get(menu.index.url(), nextVisit.query, {
                async: true,
                only: nextVisit.partialProps,
                onFinish: () => {
                    if (currentIndexVisitId.current === visitId) {
                        setIsIndexVisitPending(false);
                    }

                    if (shouldRenderLoading) {
                        handleIndexVisitFinish(visitId);
                    }
                },
                onStart: shouldRenderLoading
                    ? () => handleIndexVisitStart(visitId)
                    : undefined,
                onSuccess: (page) => {
                    if (currentIndexVisitId.current !== visitId) {
                        return;
                    }

                    const nextProps = page.props as Partial<MenuIndexProps>;

                    if (!nextProps.filters || !nextProps.items) {
                        return;
                    }

                    cacheMenuIndexTableSnapshot(nextVisit.query, {
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
        [
            handleIndexVisitFinish,
            handleIndexVisitStart,
            items,
            resetIndexLoading,
            resolveIndexVisit,
        ],
    );

    useEffect(() => {
        return () => {
            resetIndexLoading();
        };
    }, [resetIndexLoading]);

    useEffect(() => {
        cacheMenuIndexTableSnapshot(
            buildMenuIndexQuery({
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
        resetIndexLoading();
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
        resetIndexLoading,
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
        (nextItems: MenuItem[], context: RowReorderContext<MenuItem>) => {
            if (
                context.movedItem?.id === undefined ||
                context.targetItem?.sort_order === undefined
            ) {
                return;
            }

            flushIndexCaches();

            router
                .optimistic<MenuIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(menu.reorder(), {
                    method: 'post',
                    data: {
                        moved_id: context.movedItem.id,
                        target_sort_order: context.targetItem.sort_order,
                    },
                    preserveScroll: true,
                    preserveState: true,
                    only: ['items'],
                });
        },
        [flushIndexCaches, items],
    );

    const handleMove = useCallback(
        (item: MenuItem, direction: 'up' | 'down') => {
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
                .optimistic<MenuIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(menu.reorder(), {
                    method: 'post',
                    data: {
                        moved_id: item.id,
                        target_sort_order: targetItem.sort_order,
                    },
                    preserveScroll: true,
                    preserveState: true,
                    only: ['items'],
                });
        },
        [flushIndexCaches, items],
    );

    const handleDeleteRequest = useCallback((item: MenuItem) => {
        const usageCount = item.usage_count ?? 0;

        if (usageCount > 0) {
            setDeleteBlockedTarget(item);

            return;
        }

        setDeleteTarget(item);
    }, []);

    const handleDeleteConfirm = useCallback(() => {
        if (deleteTarget?.id === undefined) {
            setDeleteTarget(null);

            return;
        }

        flushIndexCaches();

        router.delete(menu.destroy.url(deleteTarget.id), {
            preserveScroll: true,
            preserveState: true,
            only: ['items', 'stats', 'activityItems', 'topOrderedItems'],
            onFinish: () => setDeleteTarget(null),
            onSuccess: () => {
                toast.success('Menu berhasil dihapus.');
            },
        });
    }, [deleteTarget, flushIndexCaches]);

    const handleActiveChange = useCallback(
        (item: MenuItem, isActive: boolean) => {
            const currentIsActive = Boolean(item.is_active);

            if (item.id === undefined || currentIsActive === isActive) {
                return;
            }

            const activeDelta = isActive ? 1 : -1;

            flushIndexCaches();

            router
                .optimistic<MenuIndexProps>(() => ({
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
                .visit(menu.status(item.id), {
                    method: 'patch',
                    data: {
                        is_active: isActive,
                    },
                    preserveScroll: true,
                    preserveState: true,
                    only: ['items', 'stats', 'activityItems'],
                    onSuccess: () => {
                        toast.success(
                            isActive
                                ? 'Menu berhasil diaktifkan.'
                                : 'Menu berhasil dinonaktifkan.',
                        );
                    },
                });
        },
        [activityItems, flushIndexCaches, items, stats],
    );

    return {
        canReorderCurrentPage,
        appendLoadingRowCount,
        deleteBlockedTarget,
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
        setDeleteBlockedTarget,
        setDeleteTarget,
        setSearch,
        visitIndex,
    };
}
