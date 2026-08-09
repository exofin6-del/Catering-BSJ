import type { DetailGalleryImage } from '@/components/shared/detail-gallery-layout';
import type { MenuPackage } from '@/types';

import {
    formatPackagePrice,
    packageDiscountPercentage,
    summarizePackagePrice,
} from './package-price';

export type PackageAuditItem = {
    date: string;
    label: string;
    userName: string;
};

export type PackageDisplayData = {
    auditItems: PackageAuditItem[];
    categoryName: string;
    description: string;
    fallbackImageLabel: string;
    galleryImages: DetailGalleryImage[];
    isActive: boolean;
    isRecommended: boolean;
    name: string;
    priceLabel: string;
    priceOriginalLabel: string | null;
    priceBadgeLabel: string | null;
    priceDiscountPercent: number;
    subtitle: string;
};

export function packageDisplayDataFromItem(
    item: MenuPackage,
): PackageDisplayData {
    const price = summarizePackagePrice(item);
    const discountPercent = packageDiscountPercentage(
        price.originalPrice,
        price.activePrice,
    );
    const categoryName = item.package_category?.name ?? 'Tanpa kategori';

    return {
        auditItems: packageAuditItems(item),
        categoryName,
        description:
            item.description?.trim() ||
            'Belum ada deskripsi paket yang ditambahkan.',
        fallbackImageLabel: 'Foto paket',
        galleryImages: packageGalleryImages(item),
        isActive: item.is_active ?? true,
        isRecommended: item.is_recommended ?? false,
        name: item.name || 'Paket tanpa nama',
        priceBadgeLabel:
            discountPercent > 0
                ? `-${discountPercent}%`
                : price.startsFrom
                  ? 'Mulai'
                  : null,
        priceDiscountPercent: discountPercent,
        priceLabel: `${price.startsFrom ? 'Mulai ' : ''}${formatPackagePrice(
            price.activePrice,
        )}`,
        priceOriginalLabel:
            price.hasDiscount && price.originalPrice > price.activePrice
                ? formatPackagePrice(price.originalPrice)
                : null,
        subtitle: packageSubtitle(item),
    };
}

export function packageSubtitle(item: MenuPackage): string {
    const categoryName = item.package_category?.name ?? 'Tanpa kategori';
    const componentCount = item.items_count ?? item.items.length;
    const minOrder = item.min_order ?? 1;

    return `${categoryName} | ${componentCount} komponen | Min. ${minOrder} porsi`;
}

export function packageGalleryImages(item: MenuPackage): DetailGalleryImage[] {
    if (item.images && item.images.length > 0) {
        return [...item.images]
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((image) => ({
                alt: item.name || 'Foto paket',
                id: String(image.id),
                isPrimary: image.is_primary,
                url: image.image_url,
            }));
    }

    if (!item.primary_image) {
        return [];
    }

    return [
        {
            alt: item.name || 'Foto utama paket',
            id: 'primary-image',
            isPrimary: true,
            url: item.primary_image,
        },
    ];
}

export function packageAuditItems(item: MenuPackage): PackageAuditItem[] {
    const items: PackageAuditItem[] = [];

    if (item.created_at) {
        items.push({
            date: item.created_at,
            label: 'Dibuat',
            userName: item.creator?.name ?? '-',
        });
    }

    if (item.updated_at) {
        const createdTime = parseDate(item.created_at)?.getTime();
        const updatedTime = parseDate(item.updated_at)?.getTime();

        if (!createdTime || updatedTime !== createdTime) {
            items.push({
                date: item.updated_at,
                label: 'Terakhir diperbarui',
                userName: item.updater?.name ?? item.creator?.name ?? '-',
            });
        }
    }

    return items;
}

export function formatPackageDate(value: string): string {
    const date = parseDate(value);

    if (!date) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function parseDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}
