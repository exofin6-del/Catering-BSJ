import type {
    Row,
    RowSelectionState,
    Table as TanStackTable,
} from '@tanstack/react-table';

export type DataTableSelectAllCheckedState = boolean | 'indeterminate';

export type DataTableSelectAllState = {
    checked: DataTableSelectAllCheckedState;
    selectablePageRowCount: number;
    selectedPageRowCount: number;
};

export function getDataTableSelectAllState<TData>({
    isAllRowsSelected,
    rows,
    selectedRowIds,
}: {
    isAllRowsSelected: boolean;
    rows: Row<TData>[];
    selectedRowIds: Set<string>;
}): DataTableSelectAllState {
    const selectableRows = rows.filter((row) => row.getCanSelect());
    const selectedPageRowCount = isAllRowsSelected
        ? selectableRows.length
        : selectableRows.filter((row) => selectedRowIds.has(row.id)).length;
    const isEveryPageRowSelected =
        selectedPageRowCount > 0 &&
        selectedPageRowCount === selectableRows.length;
    const checked =
        isAllRowsSelected || isEveryPageRowSelected
            ? true
            : selectedPageRowCount > 0
              ? 'indeterminate'
              : false;

    return {
        checked,
        selectablePageRowCount: selectableRows.length,
        selectedPageRowCount,
    };
}

export function getDataTableSelectAllNextValue(
    checked: DataTableSelectAllCheckedState,
): boolean {
    return checked !== true;
}

export function getPageRowSelection<TData>(
    table: TanStackTable<TData>,
    exceptRowId?: string,
): RowSelectionState {
    return table
        .getRowModel()
        .rows.reduce<RowSelectionState>((selection, row) => {
            if (row.getCanSelect() && row.id !== exceptRowId) {
                selection[row.id] = true;
            }

            return selection;
        }, {});
}

export function changeDataTableRowSelection<TData>({
    isAllRowsSelected,
    row,
    table,
    value,
}: {
    isAllRowsSelected: boolean;
    row: Row<TData>;
    table: TanStackTable<TData>;
    value: boolean | 'indeterminate';
}): void {
    const checked = value === true;

    if (isAllRowsSelected && checked) {
        return;
    }

    if (isAllRowsSelected && !checked) {
        table.options.meta?.setIsAllRowsSelected?.(false);
        table.setRowSelection(getPageRowSelection(table, row.id));

        return;
    }

    row.toggleSelected(checked);
}

export function changeDataTableSelectAll<TData>({
    table,
    value,
}: {
    table: TanStackTable<TData>;
    value: DataTableSelectAllCheckedState;
}): void {
    if (value === true) {
        table.options.meta?.setIsAllRowsSelected?.(true);
        table.setRowSelection(getPageRowSelection(table));

        return;
    }

    table.options.meta?.clearSelection?.();
}
