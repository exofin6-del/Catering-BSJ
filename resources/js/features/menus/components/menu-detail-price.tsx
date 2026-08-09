import { PackageDiscountBadge } from '@/features/packages/components/shared/package-badges';
import { cn } from '@/lib/utils';

import { formatMenuPrice, menuDiscountPercentage } from '../utils/menu-price';

export type MenuDetailPriceValue = {
    displayPrice: number | string | null | undefined;
    hasPromo: boolean;
    originalPrice: number | string | null | undefined;
};

export function MenuDetailPrice({
    amountClassName,
    badgeClassName,
    className,
    originalPriceClassName,
    price,
}: {
    amountClassName?: string;
    badgeClassName?: string;
    className?: string;
    originalPriceClassName?: string;
    price: MenuDetailPriceValue;
}) {
    const discountPercent = menuDiscountPercentage(
        price.originalPrice,
        price.displayPrice,
    );

    return (
        <div className={cn('flex flex-wrap items-baseline gap-2', className)}>
            <span className={cn('text-2xl font-semibold', amountClassName)}>
                {formatMenuPrice(price.displayPrice)}
            </span>
            {price.hasPromo ? (
                <>
                    <span
                        className={cn(
                            'text-sm text-muted-foreground line-through',
                            originalPriceClassName,
                        )}
                    >
                        {formatMenuPrice(price.originalPrice)}
                    </span>
                    {discountPercent > 0 ? (
                        <PackageDiscountBadge
                            discountPercent={discountPercent}
                            className={badgeClassName}
                        />
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
