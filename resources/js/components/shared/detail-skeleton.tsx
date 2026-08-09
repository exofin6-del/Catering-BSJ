import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type DetailSkeletonProps = {
    /** Show a thumbnail / image placeholder. Default: true */
    showImage?: boolean;
    /** Number of field rows to render. Default: 6 */
    fields?: number;
    /** Number of badge chips to render (e.g. tags/categories). Default: 2 */
    badges?: number;
    /** Additional class for the wrapper */
    className?: string;
};

export function DetailSkeleton({
    showImage = true,
    fields = 6,
    badges = 2,
    className,
}: DetailSkeletonProps) {
    return (
        <div
            className={cn(
                'grid gap-6 md:grid-cols-[minmax(200px,0.6fr)_1fr]',
                !showImage && 'md:grid-cols-1',
                className,
            )}
        >
            {/* Image / thumbnail placeholder */}
            {showImage && (
                <div className="flex flex-col gap-3">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <div className="flex gap-2">
                        {Array.from({ length: 3 }, (_, i) => (
                            <Skeleton
                                key={i}
                                className="h-16 flex-1 rounded-lg"
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Details column */}
            <div className="flex flex-col gap-5">
                {/* Title */}
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-7 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded" />
                </div>

                {/* Badge chips */}
                {badges > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: badges }, (_, i) => (
                            <Skeleton
                                key={i}
                                className="h-6 w-20 rounded-full"
                            />
                        ))}
                    </div>
                )}

                {/* Field rows */}
                <div className="flex flex-col gap-3">
                    {Array.from({ length: fields }, (_, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between gap-4"
                        >
                            <Skeleton
                                className="h-4 w-28 rounded"
                                style={{ opacity: 1 - i * 0.07 }}
                            />
                            <Skeleton
                                className="h-4 w-40 rounded"
                                style={{ opacity: 1 - i * 0.07 }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
