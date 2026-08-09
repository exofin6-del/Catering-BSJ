import { Check, ImageIcon, Utensils } from 'lucide-react';

import { formatOrderPrice } from '@/features/orders/utils/order-format';
import type {
    MenuPackage,
    PackageItem,
    PackageItemPrice,
    PriceValue,
} from '@/types';

import { packageDiscountPercentage } from '../../utils/package-price';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from './package-badges';

export function PackageComponentList({
    items,
}: {
    items: MenuPackage['items'];
}) {
    if (items.length === 0) {
        return (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 text-center">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ImageIcon className="size-4" />
                </div>
                <p className="text-sm font-medium text-foreground">
                    Isi paket belum tersedia
                </p>
                <p className="text-xs text-muted-foreground">
                    Tambahkan menu melalui halaman edit paket.
                </p>
            </div>
        );
    }

    const choiceGroups = items.filter((item) => item.item_prices.length > 0);
    const includedItems = items.filter((item) => item.item_prices.length === 0);

    return (
        <div className="grid gap-6">
            {choiceGroups.length > 0 ? (
                <div className="grid gap-5">
                    {choiceGroups.map((item) => (
                        <PackageChoiceGroup key={item.id} item={item} />
                    ))}
                </div>
            ) : null}

            {includedItems.length > 0 ? (
                <section className="grid gap-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                            Sudah termasuk
                        </h3>
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                            {includedItems.length} item
                        </span>
                    </div>

                    <div className="grid gap-2">
                        {includedItems.map((item) => (
                            <PackageIncludedItem key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            ) : null}
        </div>
    );
}

function PackageChoiceGroup({ item }: { item: PackageItem }) {
    return (
        <section className="grid gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    {item.name ?? 'Pilihan menu'}
                </h3>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                    Pilih satu
                </span>
            </div>

            <div className="grid gap-2">
                {item.item_prices.map((choice) => (
                    <PackageChoiceItem key={choice.id} choice={choice} />
                ))}
            </div>
        </section>
    );
}

function PackageIncludedItem({ item }: { item: PackageItem }) {
    const menuItem = item.menu_item;
    const finalPrice =
        item.package_price ??
        menuItem?.promo_price ??
        menuItem?.base_price ??
        0;

    return (
        <PackageContentItem
            basePrice={menuItem?.base_price}
            finalPrice={finalPrice}
            image={menuItem?.primary_image}
            isIncluded
            isRecommended={item.is_recommended}
            name={menuItem?.name ?? item.name ?? 'Isi paket'}
        />
    );
}

function PackageChoiceItem({ choice }: { choice: PackageItemPrice }) {
    const menuItem = choice.menu_item;
    const finalPrice =
        choice.package_price ??
        menuItem?.promo_price ??
        menuItem?.base_price ??
        0;

    return (
        <PackageContentItem
            basePrice={menuItem?.base_price}
            finalPrice={finalPrice}
            image={menuItem?.primary_image}
            isIncluded={false}
            isRecommended={choice.is_recommended}
            name={menuItem?.name ?? 'Pilihan menu'}
        />
    );
}

function PackageContentItem({
    basePrice,
    finalPrice,
    image,
    isIncluded,
    isRecommended,
    name,
}: {
    basePrice: PriceValue;
    finalPrice: PriceValue;
    image?: string | null;
    isIncluded: boolean;
    isRecommended: boolean;
    name: string;
}) {
    const discountPercent = packageDiscountPercentage(basePrice, finalPrice);

    return (
        <div className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-2xl bg-muted/30 p-2.5 text-xs">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background text-muted-foreground shadow-xs ring-1 ring-black/5 dark:ring-white/10">
                {image ? (
                    <img
                        src={image}
                        alt=""
                        className="size-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Utensils className="size-5" />
                )}
            </div>

            <div className="grid min-w-0 flex-1 gap-1.5">
                <h4 className="truncate text-sm font-semibold text-foreground">
                    {name}
                </h4>
                {discountPercent > 0 || isRecommended ? (
                    <div className="flex flex-wrap items-center gap-1">
                        {discountPercent > 0 ? (
                            <PackageDiscountBadge
                                discountPercent={discountPercent}
                            />
                        ) : null}
                        {isRecommended ? <PackageRecommendedBadge /> : null}
                    </div>
                ) : null}
            </div>

            <PackageContentPrice
                basePrice={basePrice}
                discountPercent={discountPercent}
                finalPrice={finalPrice}
            />

            <PackageSelectionIndicator checked={isIncluded} />
        </div>
    );
}

function PackageContentPrice({
    basePrice,
    discountPercent,
    finalPrice,
}: {
    basePrice: PriceValue;
    discountPercent: number;
    finalPrice: PriceValue;
}) {
    return (
        <div className="grid min-w-0 shrink-0 justify-items-end text-right leading-tight">
            {discountPercent > 0 ? (
                <span className="max-w-full truncate text-[10px] font-medium text-muted-foreground line-through">
                    {formatOrderPrice(basePrice)}
                </span>
            ) : null}
            <span className="max-w-full truncate text-sm font-semibold text-foreground tabular-nums">
                {formatOrderPrice(finalPrice)}
            </span>
        </div>
    );
}

function PackageSelectionIndicator({ checked }: { checked: boolean }) {
    return (
        <span
            aria-hidden="true"
            className={
                checked
                    ? 'flex size-5 shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground opacity-60'
                    : 'flex size-5 shrink-0 items-center justify-center rounded-md border border-border bg-background text-transparent opacity-60'
            }
        >
            <Check className="size-3 stroke-[3]" />
        </span>
    );
}
