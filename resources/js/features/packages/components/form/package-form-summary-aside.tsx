import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    FieldContent,
    FieldDescription,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { PackageDetail } from '@/features/packages/components/shared/package-detail';
import { cn } from '@/lib/utils';
import type { MenuPackage, PackageMenuItem } from '@/types';

import type {
    PackagePreviewComponent,
    PackagePreviewState,
} from '../../types/package-types';
import type { PackageDisplayData } from '../../utils/package-format';
import {
    formatPackagePrice,
    packageDiscountPercentage,
} from '../../utils/package-price';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '../shared/package-badges';

type PackageSummaryMode = 'details' | 'components' | 'publication';

export function PackageFormSummaryAside({
    className,
    defaultTab = 'details',
    preview,
    menuItems = [],
}: {
    className?: string;
    defaultTab?: PackageSummaryMode;
    preview: PackagePreviewState;
    menuItems?: PackageMenuItem[];
}) {
    const discountPercent = packageDiscountPercentage(
        preview.totalPrice,
        preview.totalActivePrice,
    );

    const display: PackageDisplayData = {
        auditItems: [],
        categoryName: preview.categoryName || 'Tanpa kategori',
        description: preview.description.trim() || 'Belum ada deskripsi paket.',
        fallbackImageLabel: 'Foto paket',
        galleryImages: preview.galleryImages.map((img) => ({
            alt: preview.name || 'Foto paket',
            id: img.id,
            isPrimary: img.isPrimary,
            url: img.url,
        })),
        isActive: preview.isActive,
        isRecommended: preview.isRecommended,
        name: preview.name || 'Nama paket',
        priceBadgeLabel:
            discountPercent > 0
                ? `-${discountPercent}%`
                : preview.totalStartsFrom
                  ? 'Mulai'
                  : null,
        priceDiscountPercent: discountPercent,
        priceLabel: `${preview.totalStartsFrom ? 'Mulai ' : ''}${formatPackagePrice(
            preview.totalActivePrice,
        )}`,
        priceOriginalLabel:
            preview.totalHasDiscount &&
            preview.totalPrice > preview.totalActivePrice
                ? formatPackagePrice(preview.totalPrice)
                : null,
        subtitle: `${preview.categoryName || 'Tanpa kategori'} | ${preview.components.length} komponen | Min. ${preview.minOrder || '1'} porsi`,
    };

    const items = mapPreviewComponentsToItems(preview.components, menuItems);

    return (
        <aside className={cn('min-w-0', className)}>
            <FieldSet className="gap-5">
                <FieldContent>
                    <FieldLegend className="text-md font-semibold text-foreground">
                        Ringkasan paket
                    </FieldLegend>
                    <FieldDescription className="text-sm leading-snug">
                        {summaryDescription(defaultTab)}
                    </FieldDescription>
                </FieldContent>

                {defaultTab === 'publication' ? (
                    <PackageDetail
                        display={display}
                        items={items}
                        layoutMode="stack"
                        showThumbnails={false}
                    />
                ) : (
                    <PackageInfoSummary
                        display={display}
                        minOrder={preview.minOrder}
                        showPrice={defaultTab === 'components'}
                    />
                )}
            </FieldSet>
        </aside>
    );
}

function PackageInfoSummary({
    display,
    minOrder,
    showPrice,
}: {
    display: PackageDisplayData;
    minOrder: string;
    showPrice: boolean;
}) {
    return (
        <div className="grid gap-4">
            <div className="grid gap-2 text-sm">
                <SummaryRow label="Nama Paket" value={display.name} />
                <SummaryRow
                    label="Status"
                    value={
                        <div className="flex flex-wrap justify-end gap-1.5">
                            <Badge
                                variant={
                                    display.isActive ? 'secondary' : 'outline'
                                }
                            >
                                {display.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            {display.isRecommended ? (
                                <PackageRecommendedBadge />
                            ) : null}
                        </div>
                    }
                />
                <SummaryRow label="Kategori" value={display.categoryName} />
                <SummaryRow
                    label="Minimal order"
                    value={`${minOrder || '1'} porsi`}
                />
                <SummaryRow label="Deskripsi" value={display.description} />
            </div>

            {showPrice ? (
                <div className="border-t border-border/60 pt-3">
                    <div className="flex flex-col gap-1 text-sm">
                        <span className="text-muted-foreground">
                            Harga preview
                        </span>
                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                            <span className="text-xl font-semibold">
                                {display.priceLabel}
                            </span>
                            {display.priceOriginalLabel ? (
                                <span className="text-xs text-muted-foreground line-through">
                                    {display.priceOriginalLabel}
                                </span>
                            ) : null}
                            {display.priceDiscountPercent > 0 ? (
                                <PackageDiscountBadge
                                    discountPercent={
                                        display.priceDiscountPercent
                                    }
                                    className="h-5 px-1.5 text-[11px] leading-none"
                                />
                            ) : display.priceBadgeLabel ? (
                                <Badge
                                    variant="outline"
                                    className="h-5 px-1.5 text-[11px] leading-none"
                                >
                                    {display.priceBadgeLabel}
                                </Badge>
                            ) : null}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="max-w-[60%] text-right font-medium break-words">
                {value}
            </span>
        </div>
    );
}

function summaryDescription(mode: PackageSummaryMode): string {
    if (mode === 'details') {
        return 'Periksa informasi dasar paket.';
    }

    if (mode === 'components') {
        return 'Periksa komponen dan harga paket.';
    }

    return 'Tinjau preview tampilan paket.';
}

function mapPreviewComponentsToItems(
    components: PackagePreviewComponent[],
    menuItems: PackageMenuItem[],
): MenuPackage['items'] {
    return components.map((c) => {
        const isChoice = c.isChoice;
        const mappedItemPrices = c.options.map((o) => {
            const menuItem = menuItems.find(
                (m) => String(m.id) === o.menuItemId,
            );

            return {
                id: Number(o.id) || 0,
                menu_item_id: menuItem ? menuItem.id : 0,
                package_price: String(o.activePrice),
                is_recommended: o.isRecommended,
                menu_item: menuItem
                    ? {
                          id: menuItem.id,
                          name: menuItem.name,
                          base_price: menuItem.base_price,
                          promo_price: menuItem.promo_price,
                          primary_image: menuItem.primary_image,
                          menu_category: menuItem.menu_category,
                      }
                    : {
                          id: 0,
                          name: o.name,
                          base_price: o.originalPrice,
                      },
            };
        });

        const fixedMenuItem = !isChoice
            ? menuItems.find((m) => String(m.id) === c.menuItemId)
            : null;

        return {
            id: Number(c.id) || 0,
            name: c.name,
            type: isChoice ? 'choice' : 'fixed',
            min_select: 1,
            max_select: 1,
            package_price: String(c.activePrice),
            item_prices: mappedItemPrices,
            menu_item: fixedMenuItem
                ? {
                      id: fixedMenuItem.id,
                      name: fixedMenuItem.name,
                      base_price: fixedMenuItem.base_price,
                      promo_price: fixedMenuItem.promo_price,
                      primary_image: fixedMenuItem.primary_image,
                      menu_category: fixedMenuItem.menu_category,
                  }
                : {
                      id: 0,
                      name: c.name,
                      base_price: c.originalPrice,
                      menu_category: {
                          id: 0,
                          name: 'Tanpa kategori',
                          sort_order: 0,
                          created_at: '',
                          updated_at: '',
                      },
                  },
        };
    }) as unknown as MenuPackage['items'];
}
