import { ImageIcon } from 'lucide-react';

import type { PackageMenuItem } from '@/types';

import { packageDiscountPercentage } from '../../../../utils/package-price';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '../../../shared/package-badges';

export function MenuItemSummary({
    isRecommended = false,
    menuItem,
    name,
    packagePrice,
}: {
    isRecommended?: boolean;
    menuItem: PackageMenuItem | null;
    name: string;
    packagePrice: string;
}) {
    if (!menuItem) {
        return (
            <div className="flex min-h-12 items-center text-sm text-muted-foreground">
                Menu tidak tersedia
            </div>
        );
    }

    const discountPercent = packageDiscountPercentage(
        menuItem.base_price,
        packagePrice || menuItem.base_price,
    );

    return (
        <div className="grid min-h-14 min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3">
            <MenuItemThumbnail item={menuItem} />
            <div className="grid min-w-0 content-center gap-1">
                <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-sm font-semibold">{name}</p>
                    {discountPercent > 0 ? (
                        <PackageDiscountBadge
                            discountPercent={discountPercent}
                        />
                    ) : null}
                    {isRecommended ? <PackageRecommendedBadge /> : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {menuItemSubtitle(menuItem)}
                </p>
            </div>
        </div>
    );
}

export function MenuItemThumbnail({ item }: { item: PackageMenuItem }) {
    if (item.primary_image) {
        return (
            <img
                src={item.primary_image}
                alt=""
                className="size-12 shrink-0 rounded-md object-cover"
            />
        );
    }

    return (
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ImageIcon className="size-5" />
        </div>
    );
}

function menuItemSubtitle(menuItem: PackageMenuItem): string {
    const categoryName = menuItem.menu_category?.name ?? 'Tanpa kategori';
    const minOrder = menuItem.min_order ?? 1;

    return `${categoryName} | Min. ${minOrder} pesanan`;
}
