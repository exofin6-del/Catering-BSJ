import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { flexRender } from '@tanstack/react-table';
import type { Row, Table as TanStackTable } from '@tanstack/react-table';
import * as React from 'react';

import { DataTableEmptyRow } from '@/components/data-table/data-table-empty-row';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import {
    changeDataTableSelectAll,
    changeDataTableRowSelection,
    getDataTableSelectAllState,
} from './data-table-selection';
import type { DataTableSelectAllCheckedState } from './data-table-selection';
import type { DataTableEmptyState } from './data-table.types';

type DataTableViewProps<TData> = {
    className?: string;
    columnsLength: number;
    dataIds: UniqueIdentifier[];
    emptyState: DataTableEmptyState;
    isSelectionActive: boolean;
    enableRowSelection: boolean;
    enableReordering: boolean;
    onDragEnd: (event: DragEndEvent) => void;
    renderAppendRows?: () => React.ReactNode;
    rowSelectionVersion: string;
    table: TanStackTable<TData>;
};

function StaticRow<TData>({
    isAllRowsSelected,
    isSelectionActive,
    row,
    selectedRowIds,
    showSelectedState,
    table,
}: {
    isAllRowsSelected: boolean;
    isSelectionActive: boolean;
    row: Row<TData>;
    selectedRowIds: Set<string>;
    showSelectedState: boolean;
    table: TanStackTable<TData>;
}) {
    const isSelected = isAllRowsSelected || selectedRowIds.has(row.id);

    return (
        <TableRow
            data-state={
                showSelectedState && isSelected ? 'selected' : undefined
            }
        >
            {row.getVisibleCells().map((cell, cellIndex) => (
                <TableCell key={cell.id}>
                    {isSelectionActive && cellIndex === 0 ? (
                        <DataTableRowSelectionCell
                            isAllRowsSelected={isAllRowsSelected}
                            row={row}
                            selected={isSelected}
                            table={table}
                        />
                    ) : (
                        flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                        )
                    )}
                </TableCell>
            ))}
        </TableRow>
    );
}

function DraggableRow<TData>({
    isAllRowsSelected,
    isSelectionActive,
    row,
    selectedRowIds,
    showSelectedState,
    table,
}: {
    isAllRowsSelected: boolean;
    isSelectionActive: boolean;
    row: Row<TData>;
    selectedRowIds: Set<string>;
    showSelectedState: boolean;
    table: TanStackTable<TData>;
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.id,
    });
    const isSelected = isAllRowsSelected || selectedRowIds.has(row.id);

    return (
        <TableRow
            data-state={
                showSelectedState && isSelected ? 'selected' : undefined
            }
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
        >
            {row.getVisibleCells().map((cell, cellIndex) => (
                <TableCell key={cell.id}>
                    {isSelectionActive && cellIndex === 0 ? (
                        <DataTableRowSelectionCell
                            isAllRowsSelected={isAllRowsSelected}
                            row={row}
                            selected={isSelected}
                            table={table}
                        />
                    ) : (
                        flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                        )
                    )}
                </TableCell>
            ))}
        </TableRow>
    );
}

function DataTableRowSelectionCell<TData>({
    isAllRowsSelected,
    row,
    selected,
    table,
}: {
    isAllRowsSelected: boolean;
    row: Row<TData>;
    selected: boolean;
    table: TanStackTable<TData>;
}) {
    return (
        <div className="flex items-center justify-center">
            <Checkbox
                checked={selected}
                onCheckedChange={(value) =>
                    changeDataTableRowSelection({
                        isAllRowsSelected,
                        row,
                        table,
                        value,
                    })
                }
                aria-label="Pilih baris"
            />
        </div>
    );
}

function DataTableSelectAllHeader<TData>({
    checked,
    disabled,
    table,
}: {
    checked: DataTableSelectAllCheckedState;
    disabled: boolean;
    table: TanStackTable<TData>;
}) {
    return (
        <div className="flex items-center justify-center">
            <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(value) =>
                    changeDataTableSelectAll({ table, value })
                }
                aria-label="Pilih semua hasil"
            />
        </div>
    );
}

export function DataTableView<TData>({
    className,
    columnsLength,
    dataIds,
    emptyState,
    isSelectionActive,
    enableRowSelection,
    enableReordering,
    onDragEnd,
    renderAppendRows,
    rowSelectionVersion,
    table,
}: DataTableViewProps<TData>) {
    const sortableId = React.useId();
    const rows = table.getRowModel().rows;
    const isAllRowsSelected = table.options.meta?.isAllRowsSelected ?? false;
    const selectedRowIds = React.useMemo(
        () => new Set(rowSelectionVersion.split('|').filter(Boolean)),
        [rowSelectionVersion],
    );
    const selectAllState = getDataTableSelectAllState({
        isAllRowsSelected,
        rows,
        selectedRowIds,
    });
    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {}),
    );

    return (
        <div
            className={cn('admin-card overflow-hidden', className)}
            data-row-selection-version={rowSelectionVersion || undefined}
        >
            <DndContext
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={onDragEnd}
                sensors={sensors}
                id={sortableId}
            >
                <Table>
                    <TableHeader className="sticky top-0 z-10">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(
                                    (header, headerIndex) => {
                                        const shouldRenderExportSelectAll =
                                            isSelectionActive &&
                                            headerIndex === 0;

                                        return (
                                            <TableHead
                                                key={header.id}
                                                colSpan={header.colSpan}
                                            >
                                                {header.isPlaceholder ? null : shouldRenderExportSelectAll ? (
                                                    <DataTableSelectAllHeader
                                                        checked={
                                                            selectAllState.checked
                                                        }
                                                        disabled={
                                                            selectAllState.selectablePageRowCount ===
                                                            0
                                                        }
                                                        table={table}
                                                    />
                                                ) : (
                                                    flexRender(
                                                        header.column.columnDef
                                                            .header,
                                                        header.getContext(),
                                                    )
                                                )}
                                            </TableHead>
                                        );
                                    },
                                )}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="**:data-[slot=table-cell]:first:w-12">
                        {rows.length ? (
                            <>
                                <SortableContext
                                    items={dataIds}
                                    strategy={verticalListSortingStrategy}
                                    disabled={!enableReordering}
                                >
                                    {rows.map((row) =>
                                        enableReordering ? (
                                            <DraggableRow
                                                isAllRowsSelected={
                                                    isAllRowsSelected
                                                }
                                                isSelectionActive={
                                                    isSelectionActive
                                                }
                                                key={row.id}
                                                row={row}
                                                selectedRowIds={selectedRowIds}
                                                showSelectedState={
                                                    enableRowSelection
                                                }
                                                table={table}
                                            />
                                        ) : (
                                            <StaticRow
                                                isAllRowsSelected={
                                                    isAllRowsSelected
                                                }
                                                isSelectionActive={
                                                    isSelectionActive
                                                }
                                                key={row.id}
                                                row={row}
                                                selectedRowIds={selectedRowIds}
                                                showSelectedState={
                                                    enableRowSelection
                                                }
                                                table={table}
                                            />
                                        ),
                                    )}
                                </SortableContext>
                                {renderAppendRows?.()}
                            </>
                        ) : (
                            <DataTableEmptyRow
                                colSpan={columnsLength}
                                emptyState={emptyState}
                            />
                        )}
                    </TableBody>
                </Table>
            </DndContext>
        </div>
    );
}
