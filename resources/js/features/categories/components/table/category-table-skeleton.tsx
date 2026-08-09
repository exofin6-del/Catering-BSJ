import { Skeleton } from '@/components/ui/skeleton';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Renders skeleton <TableCell> elements matching the category table column structure.
 *
 * Column order:
 *   [drag?] | name | type | usage | status | actions
 */
export function CategoryTableSkeletonCells({
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

            {/* Kategori column — icon mark + name + slug */}
            <TableCell className="p-2 align-middle">
                <div className="flex min-w-0 items-center gap-3 py-1">
                    <Skeleton className="size-11 shrink-0 rounded-md" />
                    <div className="grid min-w-0 flex-1 gap-2">
                        <Skeleton
                            className={cn(
                                'h-4 rounded-full',
                                index % 3 === 0 ? 'w-2/5' : 'w-3/5',
                            )}
                        />
                        <Skeleton className="h-3 w-1/3 rounded-full" />
                    </div>
                </div>
            </TableCell>

            {/* Tipe column — badge */}
            <TableCell className="p-2 align-middle">
                <Skeleton className="h-5 w-16 rounded-full" />
            </TableCell>

            {/* Pemakaian column — badge count */}
            <TableCell className="p-2 align-middle">
                <Skeleton className="h-5 w-20 rounded-full" />
            </TableCell>

            {/* Status column — badge + checkbox */}
            <TableCell className="p-2 align-middle">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="size-4 rounded-sm" />
                </div>
            </TableCell>

            {/* Actions column — edit quick action + dropdown */}
            <TableCell className="p-2 align-middle">
                <div className="flex items-center justify-end gap-1.5">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                </div>
            </TableCell>
        </>
    );
}
