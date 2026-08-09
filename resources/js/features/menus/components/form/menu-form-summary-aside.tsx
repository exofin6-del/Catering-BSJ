import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    FieldContent,
    FieldDescription,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';

import { MenuDetailPrice } from '@/features/menus/components/menu-detail-price';
import type { MenuDetailPriceValue } from '@/features/menus/components/menu-detail-price';
import { MenuDetailView } from '@/features/menus/components/menu-detail-view';
import { MenuRecommendedBadge } from '@/features/menus/components/table/menu-table-parts';
import type {
    MenuDisplayData,
    MenuPreviewState,
} from '@/features/menus/types/menu-types';
import { menuDisplayDataFromPreview } from '@/features/menus/utils/menu-format';
import { cn } from '@/lib/utils';
import type { MenuFormValues } from '../../schema/menu-form-schema';
import type { MenuImagePreview } from '../../types/menu-types';

type MenuSummaryMode = 'info' | 'info-price' | 'preview-tabs';

export function MenuFormSummaryAside({
    className,
    images = [],
    isUploadingImages = false,
    mode = 'info',
    selectedCategory,
    values,
}: {
    className?: string;
    images?: MenuImagePreview[];
    isUploadingImages?: boolean;
    mode?: MenuSummaryMode;
    selectedCategory: string;
    values: MenuFormValues;
}) {
    const primaryImage = images.find((image) => image.isPrimary) ?? images[0];

    const previewState: MenuPreviewState = {
        activityDate: '',
        activityType: 'created',
        activityUserName: '',
        basePrice: values.basePrice,
        categoryName: selectedCategory,
        description: values.description,
        galleryImages: images.map((img) => ({
            alt: values.name || 'Preview menu',
            id: img.id,
            isPrimary: img.isPrimary,
            url: img.url,
        })),
        isActive: values.isActive,
        isRecommended: values.isRecommended,
        minOrder: values.minOrder,
        name: values.name,
        primaryImage: primaryImage?.url ?? null,
        promoPrice: values.promoPrice,
    };

    const display = menuDisplayDataFromPreview(previewState);

    return (
        <aside className={cn('min-w-0', className)}>
            <FieldSet className="gap-5">
                <FieldContent>
                    <FieldLegend className="text-md font-semibold text-foreground">
                        Ringkasan menu
                    </FieldLegend>
                    <FieldDescription className="text-sm leading-snug">
                        {summaryDescription(mode)}
                    </FieldDescription>
                </FieldContent>

                {mode === 'preview-tabs' ? (
                    <MenuPreviewSummary
                        display={display}
                        imagesCount={images.length}
                        isUploadingImages={isUploadingImages}
                        selectedCategory={selectedCategory}
                    />
                ) : (
                    <MenuInfoSummary
                        display={display}
                        minOrder={values.minOrder}
                        selectedCategory={selectedCategory}
                        showPrice={mode === 'info-price'}
                    />
                )}
            </FieldSet>
        </aside>
    );
}

function MenuInfoSummary({
    display,
    minOrder,
    selectedCategory,
    showPrice,
}: {
    display: MenuDisplayData;
    minOrder: string;
    selectedCategory: string;
    showPrice: boolean;
}) {
    const price: MenuDetailPriceValue = {
        displayPrice: display.price.activePrice,
        hasPromo: display.price.hasDiscount,
        originalPrice: display.price.originalPrice,
    };

    return (
        <div className="grid gap-4">
            <div className="grid gap-2 text-sm">
                <SummaryRow label="Nama Menu" value={display.name} />
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
                                <MenuRecommendedBadge />
                            ) : null}
                        </div>
                    }
                />
                <SummaryRow label="Kategori" value={selectedCategory} />
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
                        <MenuDetailPrice
                            price={price}
                            amountClassName="text-xl"
                            originalPriceClassName="text-xs"
                            badgeClassName="h-5 px-1.5 text-[11px] leading-none"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MenuPreviewSummary({
    display,
    isUploadingImages,
    selectedCategory,
}: {
    display: MenuDisplayData;
    imagesCount: number;
    isUploadingImages: boolean;
    selectedCategory: string;
}) {
    const price: MenuDetailPriceValue = {
        displayPrice: display.price.activePrice,
        hasPromo: display.price.hasDiscount,
        originalPrice: display.price.originalPrice,
    };

    return (
        <div className="flex flex-col gap-4">
            {isUploadingImages ? (
                <div className="flex items-center justify-start">
                    <Badge variant="outline" className="gap-1">
                        <Loader2 className="size-3 animate-spin" />
                        Mengunggah gambar...
                    </Badge>
                </div>
            ) : null}

            <MenuDetailView
                categoryName={selectedCategory}
                display={display}
                layoutMode="stack"
                price={price}
                showThumbnails={false}
            />
        </div>
    );
}

function summaryDescription(mode: MenuSummaryMode): string {
    if (mode === 'info') {
        return 'Periksa informasi dasar menu.';
    }

    if (mode === 'info-price') {
        return 'Periksa informasi dan harga menu.';
    }

    return 'Tinjau preview tampilan menu.';
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
