import type { Row, Table as TanStackTable } from '@tanstack/react-table';
import * as React from 'react';
import type { ReactNode } from 'react';

import { EmptyState } from '@/components/shared/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import { changeDataTableRowSelection } from './data-table-selection';
import type {
    DataCardRenderContext,
    DataTableEmptyState,
} from './data-table.types';

type DataCardListProps<TData> = {
    appendContent?: ReactNode;
    className?: string;
    emptyState: DataTableEmptyState;
    renderCard: (context: DataCardRenderContext<TData>) => ReactNode;
    rowSelectionVersion: string;
    table: TanStackTable<TData>;
};

export function DataCardList<TData>({
    appendContent,
    className,
    emptyState,
    renderCard,
    rowSelectionVersion,
    table,
}: DataCardListProps<TData>) {
    const rows = table.getRowModel().rows;
    const isAllRowsSelected = table.options.meta?.isAllRowsSelected ?? false;
    const isSelectionActive = table.options.meta?.isSelectionActive ?? false;
    const selectedRowIds = React.useMemo(
        () => new Set(rowSelectionVersion.split('|').filter(Boolean)),
        [rowSelectionVersion],
    );

    if (!rows.length) {
        return (
            <EmptyState
                className={cn('rounded-md border py-10', className)}
                icon={emptyState.icon}
                title={emptyState.title}
                description={emptyState.description ?? emptyState.message}
            />
        );
    }

    return (
        <div
            className={cn('grid min-w-0 gap-3', className)}
            data-row-selection-version={rowSelectionVersion || undefined}
        >
            {rows.map((row) => (
                <DataCardListRow
                    isAllRowsSelected={isAllRowsSelected}
                    isSelectionActive={isSelectionActive}
                    key={row.id}
                    renderCard={renderCard}
                    row={row}
                    selected={isAllRowsSelected || selectedRowIds.has(row.id)}
                    table={table}
                />
            ))}
            {appendContent}
        </div>
    );
}

function DataCardListRow<TData>({
    isAllRowsSelected,
    isSelectionActive,
    renderCard,
    row,
    selected,
    table,
}: {
    isAllRowsSelected: boolean;
    isSelectionActive: boolean;
    renderCard: (context: DataCardRenderContext<TData>) => ReactNode;
    row: Row<TData>;
    selected: boolean;
    table: TanStackTable<TData>;
}) {
    const showSelectionControl = isSelectionActive && row.getCanSelect();

    return (
        <div
            data-state={
                showSelectionControl && selected ? 'selected' : undefined
            }
            className={cn(
                'max-w-full min-w-0',
                showSelectionControl &&
                    'grid grid-cols-[2rem_minmax(0,1fr)] items-stretch rounded-md data-[state=selected]:bg-muted/40',
            )}
        >
            {showSelectionControl ? (
                <div className="flex h-16 items-center justify-start self-start pt-3 pl-1">
                    <Checkbox
                        checked={selected}
                        aria-label="Pilih baris"
                        onCheckedChange={(value) =>
                            changeDataTableRowSelection({
                                isAllRowsSelected,
                                row,
                                table,
                                value,
                            })
                        }
                    />
                </div>
            ) : null}

            <div className="min-w-0">{renderCard({ row, table })}</div>
        </div>
    );
}
