import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TableSkeletonProps = {
    /** Number of rows to render. Default: 8 */
    rows?: number;
    /** Column widths as tailwind width classes. Default: 4 columns */
    columns?: string[];
    /** Show a toolbar skeleton above the table. Default: true */
    showToolbar?: boolean;
    /** Additional class for the wrapper */
    className?: string;
};

const defaultColumns = ['w-1/4', 'w-1/3', 'w-1/5', 'w-1/6'];

export function TableSkeleton({
    rows = 8,
    columns = defaultColumns,
    showToolbar = true,
    className,
}: TableSkeletonProps) {
    return (
        <div className={cn('flex flex-col gap-4', className)}>
            {showToolbar && (
                <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-9 w-64 rounded-lg" />
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24 rounded-lg" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                </div>
            )}

            {/* Table header */}
            <div className="rounded-xl border">
                <div className="flex items-center gap-4 border-b px-4 py-3">
                    {columns.map((colWidth, i) => (
                        <Skeleton
                            key={i}
                            className={cn('h-4 rounded', colWidth)}
                        />
                    ))}
                </div>

                {/* Table rows */}
                <div className="divide-y">
                    {Array.from({ length: rows }, (_, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-4 px-4 py-3.5"
                        >
                            {columns.map((colWidth, j) => (
                                <Skeleton
                                    key={j}
                                    className={cn('h-4 rounded', colWidth)}
                                    style={{
                                        opacity: 1 - i * 0.07,
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pagination row */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded" />
                <div className="flex gap-1">
                    {[1, 2, 3].map((n) => (
                        <Skeleton key={n} className="h-8 w-8 rounded-md" />
                    ))}
                </div>
            </div>
        </div>
    );
}
