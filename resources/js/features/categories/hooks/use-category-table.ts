import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { RowReorderContext } from '@/components/data-table';
import categories from '@/routes/categories';
import type { CategoryFilterType, CategoryRecord } from '@/types';

import type {
    CategoryFilters,
    CategoryIndexProps,
    PaginatedData,
} from '../types/category-types';
import {
    buildCategoryIndexQuery,
    cacheCategoryIndexTableSnapshot,
    canReorderCategoryIndex,
    categoryIndexCacheFor,
    categoryIndexCacheTag,
    categoryIndexPartialProps,
    categoryIndexTablePartialProps,
    flushCategoryIndexTableCache,
    getCachedCategoryIndexTableSnapshot,
} from '../utils/category-table';

type CategoryIndexVisitFilters = {
    categoryId?: number | null;
    page?: number;
    perPage?: number;
    search?: string;
    type?: CategoryFilterType;
};

type UseCategoryTableProps = {
    filters: CategoryFilters;
    items: PaginatedData<CategoryRecord>;
};

const slowIndexRequestSkeletonDelayMs = 450;

export function useCategoryTable({ filters, items }: UseCategoryTableProps) {
    const [blockedDeleteTarget, setBlockedDeleteTarget] =
        useState<CategoryRecord | null>(null);
    const [displayFilters, setDisplayFilters] = useState(filters);
    const [isIndexVisitPending, setIsIndexVisitPending] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const canReorderCurrentPage = canReorderCategoryIndex(displayFilters);
    const activeIndexVisits = useRef(0);
    const loadingTimerId = useRef<number | null>(null);
    const flushIndexCaches = useCallback(() => {
        flushCategoryIndexTableCache();
        router.flushByCacheTags(categoryIndexCacheTag);
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
        (nextFilters: CategoryIndexVisitFilters) => {
            const currentFilters = displayFilters;
            const nextSearch = nextFilters.search ?? currentFilters.search;
            const nextPerPage = nextFilters.perPage ?? currentFilters.per_page;
            const nextType = nextFilters.type ?? currentFilters.type;
            const nextCategoryId =
                nextFilters.categoryId !== undefined
                    ? nextFilters.categoryId
                    : nextFilters.type !== undefined &&
                        nextFilters.type !== currentFilters.type
                      ? null
                      : currentFilters.category_id;
            const nextPage = nextFilters.page ?? items.current_page;

            const nextDisplayFilters: CategoryFilters = {
                ...currentFilters,
                category_id: nextType === 'all' ? null : nextCategoryId,
                per_page: nextPerPage,
                search: nextSearch,
                type: nextType,
            };

            const query = buildCategoryIndexQuery({
                categoryId: nextDisplayFilters.category_id,
                page: nextPage,
                perPage: nextPerPage,
                search: nextSearch,
                type: nextType,
            });
            const isPaginationOnlyVisit =
                nextSearch === currentFilters.search &&
                nextDisplayFilters.category_id === currentFilters.category_id &&
                nextType === currentFilters.type;

            return {
                isSameVisit:
                    nextSearch === currentFilters.search &&
                    nextDisplayFilters.category_id ===
                        currentFilters.category_id &&
                    nextPerPage === currentFilters.per_page &&
                    nextType === currentFilters.type &&
                    nextPage === items.current_page,
                isTableOnlyVisit: isPaginationOnlyVisit,
                nextDisplayFilters,
                partialProps: isPaginationOnlyVisit
                    ? categoryIndexTablePartialProps
                    : categoryIndexPartialProps,
                query,
            };
        },
        [displayFilters, items.current_page],
    );

    const prefetchIndex = useCallback(
        (nextFilters: CategoryIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            if (isIndexVisitPending) {
                return;
            }

            if (
                nextVisit.isTableOnlyVisit &&
                getCachedCategoryIndexTableSnapshot(nextVisit.query)
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
                router.getCached(categories.index.url(), visitOptions) ||
                router.getPrefetching(categories.index.url(), visitOptions)
            ) {
                return;
            }

            router.prefetch(categories.index.url(), visitOptions, {
                cacheFor: categoryIndexCacheFor,
                cacheTags: categoryIndexCacheTag,
            });
        },
        [isIndexVisitPending, resolveIndexVisit],
    );

    const visitIndex = useCallback(
        (nextFilters: CategoryIndexVisitFilters) => {
            const nextVisit = resolveIndexVisit(nextFilters);

            if (nextVisit.isSameVisit) {
                return;
            }

            const cachedTableSnapshot = nextVisit.isTableOnlyVisit
                ? getCachedCategoryIndexTableSnapshot(nextVisit.query)
                : undefined;

            setIsIndexVisitPending(false);

            if (cachedTableSnapshot) {
                setDisplayFilters(cachedTableSnapshot.filters);

                router.replace({
                    url: categories.index.url({ query: nextVisit.query }),
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
                router.getCached(categories.index.url(), visitOptions),
            );

            router.get(categories.index.url(), nextVisit.query, {
                async: true,
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

                    const nextProps = page.props as Partial<CategoryIndexProps>;

                    if (!nextProps.filters || !nextProps.items) {
                        return;
                    }

                    cacheCategoryIndexTableSnapshot(nextVisit.query, {
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
        cacheCategoryIndexTableSnapshot(
            buildCategoryIndexQuery({
                categoryId: filters.category_id,
                page: items.current_page,
                perPage: filters.per_page,
                search: filters.search,
                type: filters.type,
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
            search: filters.search,
            type: filters.type,
        });
    }, [
        filters.category_id,
        filters.per_page,
        filters.per_page_options,
        filters.search,
        filters.type,
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

    const handleActiveChange = useCallback(
        (category: CategoryRecord, isActive: boolean) => {
            const currentIsActive = Boolean(category.is_active);

            if (currentIsActive === isActive) {
                return;
            }

            flushIndexCaches();

            router
                .optimistic<CategoryIndexProps>(() => ({
                    items: {
                        ...items,
                        data: items.data.map((currentCategory) =>
                            currentCategory.key === category.key
                                ? {
                                      ...currentCategory,
                                      is_active: isActive,
                                  }
                                : currentCategory,
                        ),
                    },
                }))
                .visit(categories.status([category.type, category.id]), {
                    method: 'patch',
                    data: {
                        is_active: isActive,
                    },
                    only: ['items'],
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success(
                            isActive
                                ? 'Kategori berhasil diaktifkan.'
                                : 'Kategori berhasil dinonaktifkan.',
                        );
                    },
                });
        },
        [flushIndexCaches, items],
    );

    const handleDelete = useCallback(
        (category: CategoryRecord) => {
            if ((category.usage_count ?? 0) > 0) {
                setBlockedDeleteTarget(category);

                return;
            }

            flushIndexCaches();

            router.delete(
                categories.destroy.url([category.type, category.id]),
                {
                    only: categoryIndexPartialProps,
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        toast.success('Kategori berhasil dihapus.');
                    },
                },
            );
        },
        [flushIndexCaches],
    );

    const handleReorder = useCallback(
        (
            nextItems: CategoryRecord[],
            context: RowReorderContext<CategoryRecord>,
        ) => {
            if (
                context.movedItem?.id === undefined ||
                context.targetItem?.sort_order === undefined
            ) {
                return;
            }

            flushIndexCaches();

            router
                .optimistic<CategoryIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(categories.reorder.url(), {
                    method: 'post',
                    data: {
                        type: context.movedItem.type,
                        moved_id: context.movedItem.id,
                        target_sort_order: context.targetItem.sort_order,
                    },
                    preserveScroll: true,
                    preserveState: true,
                    only: categoryIndexPartialProps,
                });
        },
        [flushIndexCaches, items],
    );

    const handleMove = useCallback(
        (category: CategoryRecord, direction: 'up' | 'down') => {
            if (category.id === undefined) {
                return;
            }

            const currentIndex = items.data.findIndex(
                (currentItem) =>
                    currentItem.id === category.id &&
                    currentItem.type === category.type,
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
            nextItems.splice(targetIndex, 0, category);

            flushIndexCaches();

            router
                .optimistic<CategoryIndexProps>(() => ({
                    items: {
                        ...items,
                        data: nextItems,
                    },
                }))
                .visit(categories.reorder.url(), {
                    method: 'post',
                    data: {
                        type: category.type,
                        moved_id: category.id,
                        target_sort_order: targetItem.sort_order,
                    },
                    preserveScroll: true,
                    preserveState: true,
                    only: categoryIndexPartialProps,
                });
        },
        [flushIndexCaches, items],
    );

    return {
        blockedDeleteTarget,
        canReorderCurrentPage,
        displayFilters,
        handleActiveChange,
        handleDelete,
        handleMove,
        handleReorder,
        isLoading,
        prefetchIndex,
        search,
        setBlockedDeleteTarget,
        setSearch,
        visitIndex,
    };
}
