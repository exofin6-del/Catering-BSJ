import type { ReactNode } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

const defaultMaxSkeletonRows = 8;

function skeletonRowKeys(rowCount: number, keyPrefix: string): string[] {
    return Array.from(
        { length: Math.min(Math.max(rowCount, 0), defaultMaxSkeletonRows) },
        (_, index) => `${keyPrefix}-${index + 1}`,
    );
}

export function DataTableMediaCardSkeletonRows({
    rowCount,
}: {
    rowCount: number;
}) {
    const rowKeys = skeletonRowKeys(rowCount, 'data-table-append-card');

    return (
        <>
            {rowKeys.map((key) => (
                <div key={key} className="max-w-full min-w-0">
                    <DataTableMediaCardSkeleton />
                </div>
            ))}
        </>
    );
}

/**
 * Renders skeleton rows inside a table body.
 *
 * Pass `renderCells` to render individual <TableCell> elements per row —
 * this guarantees pixel-perfect alignment with the real table columns
 * because the browser layout engine handles column widths automatically.
 *
 * Fall back to `colSpan` + `showLeadingColumn` for generic usage.
 */
export function DataTableMediaTableSkeletonRows({
    colSpan,
    rowCount,
    showLeadingColumn = false,
    renderCells,
}: {
    colSpan: number;
    rowCount: number;
    showLeadingColumn?: boolean;
    renderCells?: (index: number) => ReactNode;
}) {
    const rowKeys = skeletonRowKeys(rowCount, 'data-table-append-row');

    return (
        <>
            {rowKeys.map((key, index) =>
                renderCells ? (
                    <TableRow key={key} className="hover:bg-transparent">
                        {renderCells(index)}
                    </TableRow>
                ) : (
                    <TableRow key={key} className="hover:bg-transparent">
                        <TableCell colSpan={colSpan} className="!w-auto p-0">
                            <DataTableMediaTableSkeletonItem
                                index={index}
                                showLeadingColumn={showLeadingColumn}
                            />
                        </TableCell>
                    </TableRow>
                ),
            )}
        </>
    );
}

function DataTableMediaCardSkeleton() {
    return (
        <div
            aria-hidden="true"
            className="flex min-w-0 items-start gap-3 overflow-hidden py-3"
        >
            <DataTableMediaCardSkeletonBody />
        </div>
    );
}

function DataTableMediaCardSkeletonBody() {
    return (
        <>
            <Skeleton className="size-16 shrink-0 rounded-lg" />
            <div className="flex min-h-16 min-w-0 flex-1 items-start gap-2 overflow-hidden border-b pb-3">
                <div className="grid min-w-0 flex-1 gap-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-2/3 rounded-full" />
                        <Skeleton className="ml-auto size-5 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-1/2 rounded-full" />
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="grid min-w-0 flex-1 gap-1.5">
                            <Skeleton className="h-3.5 w-24 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded-full" />
                        </div>
                    </div>
                </div>
                <Skeleton className="size-8 shrink-0 rounded-md" />
            </div>
        </>
    );
}

/** Generic fallback skeleton item — used when `renderCells` is not provided. */
function DataTableMediaTableSkeletonItem({
    index,
    showLeadingColumn,
}: {
    index: number;
    showLeadingColumn: boolean;
}) {
    return (
        <div
            className={`grid min-h-20 items-center gap-3 px-3 py-3 ${
                showLeadingColumn
                    ? 'grid-cols-[3rem_minmax(12rem,1fr)_9rem_10rem_7rem]'
                    : 'grid-cols-[minmax(12rem,1fr)_9rem_10rem_7rem]'
            }`}
        >
            {showLeadingColumn ? (
                <Skeleton className="mx-auto size-8 rounded-md" />
            ) : null}
            <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-12 shrink-0 rounded-lg" />
                <div className="grid min-w-0 flex-1 gap-2">
                    <Skeleton
                        className={`h-4 rounded-full ${index % 3 === 0 ? 'w-3/5' : 'w-4/5'}`}
                    />
                    <Skeleton className="h-3 w-2/5 rounded-full" />
                </div>
            </div>
            <div className="grid gap-1.5">
                <Skeleton className="h-3.5 w-20 rounded-full" />
                <Skeleton className="h-3 w-14 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="size-4 rounded-sm" />
            </div>
            <div className="flex justify-end gap-1.5">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
            </div>
        </div>
    );
}
