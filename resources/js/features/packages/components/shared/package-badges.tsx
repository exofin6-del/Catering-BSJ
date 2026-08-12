import { Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PackageDiscountBadge({
    className,
    discountPercent,
}: {
    className?: string;
    discountPercent: number;
}) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'pointer-events-none h-4 px-1 text-[11px] leading-none select-none',
                className,
            )}
        >
            -{discountPercent}%
        </Badge>
    );
}

export function PackageRecommendedBadge({
    className,
    iconOnly = false,
}: {
    className?: string;
    iconOnly?: boolean;
}) {
    return (
        <Badge
            aria-label={iconOnly ? 'Rekomendasi' : undefined}
            variant="secondary"
            className={cn(
                'shrink-0 rounded-lg',
                iconOnly
                    ? 'flex size-5 items-center justify-center p-0'
                    : 'flex h-5 items-center gap-1 px-2 text-[12px] leading-none font-medium',
                className,
            )}
        >
            {iconOnly ? (
                <Star className="size-3 fill-current" />
            ) : (
                <>
                    <Star className="size-3 fill-current" />
                    Rekomendasi
                </>
            )}
        </Badge>
    );
}
