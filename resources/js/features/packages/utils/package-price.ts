import type {
    MenuPackage,
    PackageItem,
    PackageMenuItem,
    PriceValue,
} from '@/types';

export type PackagePriceSummary = {
    activePrice: number;
    hasDiscount: boolean;
    originalPrice: number;
    startsFrom: boolean;
};

export function formatPackagePrice(value: PriceValue): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(priceNumber(value));
}

export function priceNumber(value: PriceValue): number {
    if (value === null || value === undefined || value === '') {
        return 0;
    }

    const amount = Number(value);

    return Number.isFinite(amount) ? amount : 0;
}

export function stringifyPrice(value: PriceValue): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    return String(value).replace(/\.00$/, '');
}

export function menuItemBasePrice(item?: PackageMenuItem | null): string {
    return item ? stringifyPrice(item.base_price) : '';
}

export function menuItemPromoPrice(item?: PackageMenuItem | null): string {
    if (!hasMenuItemPromo(item)) {
        return '';
    }

    return stringifyPrice(item?.promo_price);
}

export function hasMenuItemPromo(item?: PackageMenuItem | null): boolean {
    return (
        item?.promo_price !== null &&
        item?.promo_price !== undefined &&
        item.promo_price !== ''
    );
}

export function packageDiscountPercentage(
    originalPrice: PriceValue,
    activePrice: PriceValue,
): number {
    const original = priceNumber(originalPrice);
    const active = priceNumber(activePrice);

    if (original <= 0 || active >= original) {
        return 0;
    }

    return Math.round(((original - active) / original) * 100);
}

export function summarizePackagePrice(item: MenuPackage): PackagePriceSummary {
    if (item.items.length === 0) {
        const price = priceNumber(item.price);

        return {
            activePrice: price,
            hasDiscount: false,
            originalPrice: price,
            startsFrom: false,
        };
    }

    const componentSummaries = item.items.map(summarizePackageItemPrice);
    const activePrice = componentSummaries.reduce(
        (total, summary) => total + summary.activePrice,
        0,
    );
    const originalPrice = componentSummaries.reduce(
        (total, summary) => total + summary.originalPrice,
        0,
    );

    return {
        activePrice,
        hasDiscount: originalPrice > 0 && activePrice < originalPrice,
        originalPrice,
        startsFrom: componentSummaries.some((summary) => summary.startsFrom),
    };
}

export function summarizePackageItemPrice(
    item: PackageItem,
): PackagePriceSummary {
    if (item.item_prices.length > 0) {
        const optionSummaries = item.item_prices.map((option) => {
            const activePrice =
                option.package_price ??
                option.menu_item?.promo_price ??
                option.menu_item?.base_price;
            const originalPrice = option.menu_item?.base_price;

            return componentPriceSummary(activePrice, originalPrice, true);
        });

        return (
            lowestDisplayPriceSummary(optionSummaries) ??
            componentPriceSummary(
                item.package_price,
                item.menu_item?.promo_price ?? item.menu_item?.base_price,
            )
        );
    }

    return componentPriceSummary(
        item.package_price ??
            item.menu_item?.promo_price ??
            item.menu_item?.base_price,
        item.menu_item?.base_price,
    );
}

function componentPriceSummary(
    activePriceValue: PriceValue,
    originalPriceValue: PriceValue,
    startsFrom = false,
): PackagePriceSummary {
    const activePrice = priceNumber(activePriceValue);
    const originalPrice = priceNumber(originalPriceValue);

    return {
        activePrice,
        hasDiscount: originalPrice > 0 && activePrice < originalPrice,
        originalPrice,
        startsFrom,
    };
}

export function lowestDisplayPriceSummary(
    summaries: PackagePriceSummary[],
): PackagePriceSummary | null {
    if (summaries.length === 0) {
        return null;
    }

    const pricedSummaries = summaries.filter(
        (summary) => summary.activePrice > 0,
    );

    return (pricedSummaries.length > 0 ? pricedSummaries : summaries).reduce(
        (lowest, summary) => {
            if (summary.activePrice < lowest.activePrice) {
                return summary;
            }

            if (
                summary.activePrice === lowest.activePrice &&
                summary.originalPrice > lowest.originalPrice
            ) {
                return summary;
            }

            return lowest;
        },
    );
}
