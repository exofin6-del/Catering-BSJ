import type { UniqueIdentifier } from '@dnd-kit/core';
import type {
    ColumnDef,
    Row,
    Table as TanStackTable,
} from '@tanstack/react-table';
import type { ReactNode } from 'react';

export type DataTableGetRowId<TData> = (
    originalRow: TData,
    index: number,
    parent?: Row<TData>,
) => string;

export type RowReorderContext<TData> = {
    movedId: UniqueIdentifier;
    targetId: UniqueIdentifier;
    oldIndex: number;
    newIndex: number;
    movedItem?: TData;
    targetItem?: TData;
};

export type DataTableEmptyState = {
    description?: ReactNode;
    icon?: ReactNode;
    message?: ReactNode;
    title?: ReactNode;
};

export type DataCardRenderContext<TData> = {
    row: Row<TData>;
    table: TanStackTable<TData>;
};

export type DataTableAppendRenderContext<TData> = {
    columnsLength: number;
    table: TanStackTable<TData>;
};

export type DataTableToolbarRenderContext = {
    isAllRowsSelected: boolean;
    isExportSelectionMode: boolean;
    selectedRowCount: number;
    setIsExportSelectionMode: (value: boolean) => void;
};

export type DataTableProps<TData, TValue> = {
    data: TData[];
    columns: ColumnDef<TData, TValue>[];
    getRowId?: DataTableGetRowId<TData>;
    className?: string;
    cardListClassName?: string;
    tableWrapperClassName?: string;
    paginationClassName?: string;
    emptyMessage?: string;
    emptyTitle?: ReactNode;
    emptyDescription?: ReactNode;
    emptyIcon?: ReactNode;
    enableRowSelection?: boolean;
    enableReordering?: boolean;
    manualPagination?: boolean;
    pageCount?: number;
    pageIndex?: number;
    rowCount?: number;
    pageSizeOptions?: number[];
    pageSize?: number;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onReorder?: (data: TData[], context: RowReorderContext<TData>) => void;
    renderCard?: (context: DataCardRenderContext<TData>) => ReactNode;
    renderCardAppend?: (
        context: DataTableAppendRenderContext<TData>,
    ) => ReactNode;
    renderTableBodyAppend?: (
        context: DataTableAppendRenderContext<TData>,
    ) => ReactNode;
    renderToolbar?: (
        table: TanStackTable<TData>,
        context: DataTableToolbarRenderContext,
    ) => ReactNode;
    renderContent?: (
        content: ReactNode,
        table: TanStackTable<TData>,
    ) => ReactNode;
};
