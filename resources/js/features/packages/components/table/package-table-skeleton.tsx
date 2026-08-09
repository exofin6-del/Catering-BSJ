import { Skeleton } from '@/components/ui/skeleton';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Renders skeleton <TableCell> elements matching the package table column structure.
 *
 * Column order:
 *   [drag?] | name | price | components | status | actions
 */
export function PackageTableSkeletonCells({
    index,
    showLeadingColumn,
}: {
    index: number;
    showLeadingColumn: boolean;
}) {
    return (
        <>
            {/* Drag handle column */}
            {showLeadingColumn ? (
                <TableCell className="w-12 p-2 text-center align-middle">
                    <div className="flex h-10 items-center justify-center">
                        <Skeleton className="size-8 rounded-md" />
                    </div>
                </TableCell>
            ) : null}

            {/* Paket column — thumbnail + name + subtitle + recommended badge */}
            <TableCell className="p-2 align-middle">
                <div className="flex min-w-0 items-center gap-3 py-1">
                    <Skeleton className="size-12 shrink-0 rounded-md" />
                    <div className="grid min-w-0 flex-1 gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                            <Skeleton
                                className={cn(
                                    'h-4 rounded-full',
                                    index % 3 === 0 ? 'w-3/5' : 'w-4/5',
                                )}
                            />
                            <Skeleton className="hidden h-5 w-20 shrink-0 rounded-full sm:block" />
                        </div>
                        <Skeleton className="h-3 w-2/5 rounded-full" />
                    </div>
                </div>
            </TableCell>

            {/* Harga column — display price + original/discount */}
            <TableCell className="p-2 align-middle">
                <div className="grid gap-1.5">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-3 w-14 rounded-full" />
                </div>
            </TableCell>

            {/* Komponen column — count text */}
            <TableCell className="p-2 align-middle">
                <Skeleton className="h-4 w-20 rounded-full" />
            </TableCell>

            {/* Status column — badge + checkbox */}
            <TableCell className="p-2 align-middle">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="size-4 rounded-sm" />
                </div>
            </TableCell>

            {/* Actions column — view + edit quick actions + dropdown */}
            <TableCell className="p-2 align-middle">
                <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                </div>
            </TableCell>
        </>
    );
}
