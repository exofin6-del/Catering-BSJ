import { Skeleton } from '@/components/ui/skeleton';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * Renders skeleton <TableCell> elements matching the order table column structure.
 *
 * Column order:
 *   Order (code+status+customer) | Acara (name+date+time) | Pembayaran (price+status) | Sumber (badge) | Aksi
 *
 * Note: Order table uses fixed min-widths on cells (via column cell wrappers),
 * so the skeleton cells mirror those proportions.
 */
export function OrderTableSkeletonCells({
    index,
    showLeadingColumn = false,
}: {
    index: number;
    showLeadingColumn?: boolean;
}) {
    return (
        <>
            {/* Drag handle / selection column */}
            {showLeadingColumn ? (
                <TableCell className="w-12 p-2 text-center align-middle">
                    <div className="flex h-10 items-center justify-center">
                        <Skeleton className="size-8 rounded-md" />
                    </div>
                </TableCell>
            ) : null}
            {/* Order column — code + status badge + customer name */}
            <TableCell className="p-2 align-middle">
                <div className="w-[18rem] max-w-[34vw] min-w-[17rem] py-1">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton
                                className={cn(
                                    'h-4 rounded-full tabular-nums',
                                    index % 2 === 0 ? 'w-28' : 'w-24',
                                )}
                            />
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="grid gap-1">
                            <Skeleton className="h-3 w-3/5 rounded-full" />
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Acara column — event name + date + time */}
            <TableCell className="p-2 align-middle">
                <div className="w-[16rem] max-w-[30vw] min-w-[14rem] py-1">
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-4/5 rounded-full" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-3 w-24 rounded-full" />
                            <Skeleton className="h-3 w-16 rounded-full" />
                        </div>
                    </div>
                </div>
            </TableCell>

            {/* Pembayaran column — total price + payment status */}
            <TableCell className="p-2 align-middle">
                <div className="flex min-w-[11.5rem] justify-center px-3 py-1">
                    <div className="grid gap-1.5">
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                </div>
            </TableCell>

            {/* Sumber column — admin/customer badge */}
            <TableCell className="p-2 align-middle">
                <div className="flex min-w-[9.5rem] justify-center px-3 py-1">
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </TableCell>

            {/* Aksi column — view + edit + quick actions + dropdown */}
            <TableCell className="p-2 align-middle">
                <div className="flex min-w-[10rem] items-center justify-end gap-1.5 py-1">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                </div>
            </TableCell>
        </>
    );
}
