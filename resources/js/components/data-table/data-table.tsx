import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type {
    ColumnDef,
    ColumnFiltersState,
    PaginationState,
    Row,
    RowData,
    RowSelectionState,
    SortingState,
    Updater,
    VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

import { DataCardList } from '@/components/data-table/data-card-list';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { DataTableView } from '@/components/data-table/data-table-view';
import { cn } from '@/lib/utils';

import type {
    DataTableProps,
    DataTableToolbarRenderContext,
} from './data-table.types';
import { TableScaleWrapper } from './table-scale-wrapper';
export type {
    DataCardRenderContext,
    DataTableEmptyState,
    DataTableGetRowId,
    DataTableProps,
    DataTableToolbarRenderContext,
    RowReorderContext,
} from './data-table.types';

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface TableMeta<TData extends RowData> {
        clearSelection?: () => void;
        isAllRowsSelected?: boolean;
        isExportSelectionMode?: boolean;
        setIsExportSelectionMode?: (val: boolean) => void;
        setIsAllRowsSelected?: (val: boolean) => void;
        isSelectionActive?: boolean;
        selectedRowCount?: number;
        totalRowCount?: number;
    }
}

const useIsomorphicLayoutEffect =
    typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function DataTable<TData, TValue>({
    data: initialData,
    columns,
    getRowId,
    className,
    cardListClassName,
    tableWrapperClassName,
    paginationClassName,
    emptyMessage = 'No results.',
    emptyTitle,
    emptyDescription,
    emptyIcon,
    enableRowSelection = false,
    enableReordering = false,
    manualPagination = false,
    pageCount,
    pageIndex,
    rowCount,
    pageSizeOptions = [10, 25, 50, 100],
    pageSize,
    onPageChange,
    onPageSizeChange,
    onReorder,
    renderCard,
    renderCardAppend,
    renderToolbar,
    renderContent,
    renderTableBodyAppend,
}: DataTableProps<TData, TValue>) {
    'use client';
    'use no memo';

    const [isExportSelectionMode, setIsExportSelectionMode] =
        React.useState(false);
    const [isAllRowsSelected, setIsAllRowsSelected] = React.useState(false);
    const [data, setData] = React.useState(() => initialData);
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
        {},
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [pagination, setPaginationState] = React.useState<PaginationState>({
        pageIndex: pageIndex ?? 0,
        pageSize: pageSize ?? pageSizeOptions?.[0] ?? 10,
    });
    const [paginationChangeVersion, setPaginationChangeVersion] =
        React.useState(0);
    const pendingPaginationChange = React.useRef<{
        pageIndex?: number;
        pageSize?: number;
    } | null>(null);
    const isAllRowsSelectedRef = React.useRef(isAllRowsSelected);
    const controlledPagination = React.useRef({
        pageIndex,
        pageSize,
    });

    const resolvedPagination = pagination;
    isAllRowsSelectedRef.current = isAllRowsSelected;

    const resolvedPageCount = React.useMemo(() => {
        if (rowCount !== undefined) {
            return Math.max(
                1,
                Math.ceil(rowCount / resolvedPagination.pageSize),
            );
        }

        return pageCount;
    }, [pageCount, resolvedPagination.pageSize, rowCount]);

    useIsomorphicLayoutEffect(() => {
        setData(initialData);

        if (!isAllRowsSelectedRef.current) {
            setRowSelection({});
        }
    }, [initialData]);

    useIsomorphicLayoutEffect(() => {
        if (!isExportSelectionMode) {
            setRowSelection({});
            setIsAllRowsSelected(false);
        }
    }, [isExportSelectionMode]);

    useIsomorphicLayoutEffect(() => {
        const previousControlledPagination = controlledPagination.current;
        const nextControlledPagination = {
            pageIndex,
            pageSize,
        };
        const pageIndexChanged =
            pageIndex !== undefined &&
            pageIndex !== previousControlledPagination.pageIndex;
        const pageSizeChanged =
            pageSize !== undefined &&
            pageSize !== previousControlledPagination.pageSize;

        controlledPagination.current = nextControlledPagination;

        if (!pageIndexChanged && !pageSizeChanged) {
            return;
        }

        setPaginationState((currentPagination) => {
            const nextPagination = {
                pageIndex: pageSizeChanged
                    ? 0
                    : pageIndexChanged
                      ? (pageIndex ?? currentPagination.pageIndex)
                      : currentPagination.pageIndex,
                pageSize: pageSizeChanged
                    ? (pageSize ?? currentPagination.pageSize)
                    : currentPagination.pageSize,
            };

            if (
                nextPagination.pageIndex === currentPagination.pageIndex &&
                nextPagination.pageSize === currentPagination.pageSize
            ) {
                return currentPagination;
            }

            return nextPagination;
        });
    }, [pageIndex, pageSize]);

    const resolveRowId = React.useCallback(
        (row: TData, index: number, parent?: Row<TData>) => {
            return getRowId?.(row, index, parent) ?? index.toString();
        },
        [getRowId],
    );

    const dataIds = React.useMemo<UniqueIdentifier[]>(
        () => data.map((row, index) => resolveRowId(row, index)),
        [data, resolveRowId],
    );
    const rowSelectionVersion = React.useMemo(
        () =>
            Object.entries(rowSelection)
                .filter(([, selected]) => selected)
                .map(([rowId]) => rowId)
                .sort()
                .join('|'),
        [rowSelection],
    );
    const selectedPageRowCount = React.useMemo(
        () => Object.values(rowSelection).filter(Boolean).length,
        [rowSelection],
    );
    const totalRowCount = rowCount ?? data.length;
    const selectedRowCount = isAllRowsSelected
        ? totalRowCount
        : selectedPageRowCount;

    const setExportSelectionMode = React.useCallback((value: boolean) => {
        setRowSelection({});
        setIsAllRowsSelected(false);
        setIsExportSelectionMode(value);
    }, []);

    const clearSelection = React.useCallback(() => {
        setRowSelection({});
        setIsAllRowsSelected(false);
    }, []);

    const setPagination = React.useCallback(
        (updater: Updater<PaginationState>) => {
            const nextPagination =
                typeof updater === 'function'
                    ? updater(resolvedPagination)
                    : updater;
            const pageIndexChanged =
                nextPagination.pageIndex !== resolvedPagination.pageIndex;
            const pageSizeChanged =
                nextPagination.pageSize !== resolvedPagination.pageSize;

            setPaginationState((currentPagination) => {
                const nextState = {
                    pageIndex:
                        pageIndex === undefined
                            ? nextPagination.pageIndex
                            : currentPagination.pageIndex,
                    pageSize:
                        pageSize === undefined
                            ? nextPagination.pageSize
                            : currentPagination.pageSize,
                };

                if (
                    nextState.pageIndex === currentPagination.pageIndex &&
                    nextState.pageSize === currentPagination.pageSize
                ) {
                    return currentPagination;
                }

                return nextState;
            });

            if (!pageIndexChanged && !pageSizeChanged) {
                return;
            }

            pendingPaginationChange.current = {
                pageIndex: pageIndexChanged
                    ? nextPagination.pageIndex
                    : undefined,
                pageSize: pageSizeChanged ? nextPagination.pageSize : undefined,
            };
            setPaginationChangeVersion((version) => version + 1);
        },
        [pageIndex, pageSize, resolvedPagination],
    );

    useIsomorphicLayoutEffect(() => {
        const pendingChange = pendingPaginationChange.current;

        if (!pendingChange) {
            return;
        }

        pendingPaginationChange.current = null;

        if (pendingChange.pageSize !== undefined) {
            onPageSizeChange?.(pendingChange.pageSize);

            if (onPageSizeChange) {
                return;
            }
        }

        if (pendingChange.pageIndex !== undefined) {
            onPageChange?.(pendingChange.pageIndex);
        }
    }, [paginationChangeVersion, onPageChange, onPageSizeChange]);

    const isFilterActive = columnFilters.length > 0;
    const isSelectionActive =
        isExportSelectionMode || isFilterActive || enableRowSelection;

    const resolvedColumns = React.useMemo(() => {
        if (!isSelectionActive) {
            return columns;
        }

        let cols = columns.filter((col) => col.id !== 'drag');

        const hasSelectCol = cols.some((col) => col.id === 'select');

        if (!hasSelectCol) {
            const selectCol: ColumnDef<TData> = {
                id: 'select',
                header: () => null,
                cell: () => null,
                enableSorting: false,
                enableHiding: false,
            };
            cols = [selectCol, ...cols];
        }

        return cols;
    }, [columns, isSelectionActive]);

    // eslint-disable-next-line react-hooks/incompatible-library
    const table = useReactTable({
        data,
        columns: resolvedColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination: resolvedPagination,
        },
        getRowId: resolveRowId,
        enableRowSelection: isSelectionActive,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: manualPagination
            ? undefined
            : getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        manualPagination,
        pageCount: resolvedPageCount,
        rowCount,
        meta: {
            clearSelection,
            isAllRowsSelected,
            isExportSelectionMode,
            setIsAllRowsSelected,
            setIsExportSelectionMode: setExportSelectionMode,
            isSelectionActive,
            selectedRowCount,
            totalRowCount,
        },
    });

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        setData((currentData) => {
            const oldIndex = currentData.findIndex(
                (row, index) =>
                    resolveRowId(row, index).toString() ===
                    active.id.toString(),
            );
            const newIndex = currentData.findIndex(
                (row, index) =>
                    resolveRowId(row, index).toString() === over.id.toString(),
            );

            if (oldIndex === -1 || newIndex === -1) {
                return currentData;
            }

            const reorderedData = arrayMove(currentData, oldIndex, newIndex);

            onReorder?.(reorderedData, {
                movedId: active.id,
                targetId: over.id,
                oldIndex,
                newIndex,
                movedItem: currentData[oldIndex],
                targetItem: currentData[newIndex],
            });

            return reorderedData;
        });
    }

    const emptyState = {
        description: emptyDescription,
        icon: emptyIcon,
        message: emptyMessage,
        title: emptyTitle,
    };
    const appendRenderContext = {
        columnsLength: resolvedColumns.length,
        table,
    };
    const toolbarRenderContext: DataTableToolbarRenderContext = {
        isAllRowsSelected,
        isExportSelectionMode,
        selectedRowCount,
        setIsExportSelectionMode: setExportSelectionMode,
    };

    const tableElement = (
        <>
            {renderCard ? (
                <DataCardList
                    table={table}
                    renderCard={renderCard}
                    appendContent={renderCardAppend?.(appendRenderContext)}
                    emptyState={emptyState}
                    rowSelectionVersion={rowSelectionVersion}
                    className={cn('md:hidden', cardListClassName)}
                />
            ) : null}

            <TableScaleWrapper className={cn(renderCard && 'hidden md:block')}>
                <DataTableView
                    table={table}
                    columnsLength={resolvedColumns.length}
                    dataIds={dataIds}
                    emptyState={emptyState}
                    isSelectionActive={isSelectionActive}
                    enableRowSelection={isSelectionActive}
                    enableReordering={enableReordering && !isSelectionActive}
                    onDragEnd={handleDragEnd}
                    renderAppendRows={
                        renderTableBodyAppend
                            ? () => renderTableBodyAppend(appendRenderContext)
                            : undefined
                    }
                    rowSelectionVersion={rowSelectionVersion}
                    className={cn(
                        renderCard && 'admin-card',
                        tableWrapperClassName,
                    )}
                />
            </TableScaleWrapper>

            <DataTablePagination
                table={table}
                pageCount={resolvedPageCount}
                pageIndex={resolvedPagination.pageIndex}
                pageSize={resolvedPagination.pageSize}
                pageSizeOptions={pageSizeOptions}
                className={cn(paginationClassName)}
            />
        </>
    );

    return (
        <div className={cn('flex w-full flex-col gap-4', className)}>
            {renderToolbar ? (
                <div>{renderToolbar(table, toolbarRenderContext)}</div>
            ) : null}
            {renderContent ? renderContent(tableElement, table) : tableElement}
        </div>
    );
}
