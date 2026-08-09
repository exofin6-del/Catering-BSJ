import type { MenuItem } from '@/types';
import type { ResolvedMenuPrice } from '../types/menu-types';

export function priceToNumber(
    value: number | string | null | undefined,
): number {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (!value) {
        return 0;
    }

    const normalizedValue = value.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsedValue = Number(normalizedValue);

    return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function resolveMenuPrice(item: MenuItem): ResolvedMenuPrice {
    const originalPrice = item.base_price ?? item.price ?? 0;
    const promoPrice = item.promo_price ?? null;
    const originalPriceNumber = priceToNumber(originalPrice);
    const promoPriceNumber = priceToNumber(promoPrice);
    const hasPromo =
        promoPrice !== null && promoPriceNumber < originalPriceNumber;
    const displayPrice = hasPromo ? promoPrice : originalPrice;

    return {
        displayPrice,
        hasPromo,
        originalPrice,
        promoPrice,
        sortValue: hasPromo ? promoPriceNumber : originalPriceNumber,
    };
}

export function menuDiscountPercentage(
    originalPrice: number | string | null | undefined,
    displayPrice: number | string | null | undefined,
): number {
    const originalPriceNumber = priceToNumber(originalPrice);
    const displayPriceNumber = priceToNumber(displayPrice);

    if (originalPriceNumber <= 0 || displayPriceNumber >= originalPriceNumber) {
        return 0;
    }

    return Math.round(
        ((originalPriceNumber - displayPriceNumber) / originalPriceNumber) *
            100,
    );
}

export function formatMenuPrice(
    value: number | string | null | undefined,
): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(priceToNumber(value));
}
