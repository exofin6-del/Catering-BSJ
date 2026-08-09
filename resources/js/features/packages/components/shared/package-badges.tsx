import { Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const discountBadgeVariants = {
    default:
        'h-5 shrink-0 px-1.5 rounded-md text-[11px] font-semibold leading-none text-primary border-primary/20 bg-primary/10 select-none pointer-events-none',
    primary:
        'h-5 shrink-0 px-1.5 rounded-md text-[11px] font-semibold leading-none text-primary border-primary/20 bg-primary/10 select-none pointer-events-none',
} as const;

export function PackageDiscountBadge({
    className,
    discountPercent,
    variant = 'primary',
}: {
    className?: string;
    discountPercent: number;
    variant?: 'default' | 'primary';
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
