import type { MenuItem } from '@/types';
import type {
    MenuDisplayData,
    MenuFormState,
    MenuImagePreview,
    MenuPreviewState,
} from '../types/menu-types';

export function createSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function createPreviewId(file: File): string {
    return (
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${file.name}-${file.size}`
    );
}

export function stringifyPrice(
    value: MenuItem['base_price'] | null | undefined,
): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value).replace(/\.00$/, '');
}

export function initialMenuFormState(item: MenuItem | null): MenuFormState {
    const categoryId = item?.menu_category?.id
        ? String(item.menu_category.id)
        : '';
    const categoryName = item?.menu_category?.name ?? '';
    const name = item?.name ?? '';

    return {
        basePrice: stringifyPrice(item?.base_price ?? item?.price),
        categoryId,
        categoryName,
        description: item?.description ?? '',
        isActive: item?.is_active ?? true,
        isRecommended: item?.is_recommended ?? false,
        minOrder: String(item?.min_order ?? 1),
        name,
        promoPrice: stringifyPrice(item?.promo_price),
        slug: item?.slug ?? createSlug(name),
    };
}

export function initialMenuImages(item: MenuItem | null): MenuImagePreview[] {
    if (item?.images && item.images.length > 0) {
        return [...item.images]
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((image) => ({
                existingId: image.id,
                id: `existing-${image.id}`,
                isPrimary: image.is_primary,
                name: item.name ?? 'Foto menu',
                url: image.image_url,
            }));
    }

    if (!item?.primary_image) {
        return [];
    }

    return [
        {
            id: 'existing-primary',
            isPrimary: true,
            name: item.name ?? 'Foto utama',
            url: item.primary_image,
        },
    ];
}

export function buildMenuImageSubmitPayload(
    images: MenuImagePreview[],
    removedImageIds: number[] = [],
): {
    primary_image_id: number | null;
    primary_temporary_image_id: string | null;
    removed_image_ids: number[];
    temporary_image_id: string | null;
    temporary_image_ids: string[];
} {
    const temporaryImageIds = images
        .map((image) => image.temporaryId)
        .filter((id): id is string => Boolean(id));
    const primaryTemporaryImageId =
        images.find((image) => image.isPrimary)?.temporaryId ?? null;
    const primaryImageId =
        images.find((image) => image.isPrimary)?.existingId ?? null;

    return {
        primary_image_id: primaryImageId,
        primary_temporary_image_id: primaryTemporaryImageId,
        removed_image_ids: removedImageIds,
        temporary_image_id:
            primaryTemporaryImageId ?? temporaryImageIds[0] ?? null,
        temporary_image_ids: temporaryImageIds,
    };
}

export function revokeObjectUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

export function menuDisplayDataFromPreview(
    preview: MenuPreviewState,
): MenuDisplayData {
    const name = preview.name || 'Nama menu';
    const originalPrice = preview.basePrice || '0';
    const promoPrice = preview.promoPrice || originalPrice;
    const hasPromo =
        preview.promoPrice != null &&
        preview.promoPrice !== '' &&
        preview.promoPrice !== originalPrice;
    const createdAt =
        preview.createdAt ??
        (preview.activityType === 'created' ? preview.activityDate : null);
    const createdByName =
        preview.createdByName ??
        (preview.activityType === 'created' ? preview.activityUserName : '-');
    const updatedAt =
        preview.updatedAt ??
        (preview.activityType === 'updated' ? preview.activityDate : null);
    const updatedByName =
        preview.updatedByName ??
        (preview.activityType === 'updated' ? preview.activityUserName : '-');

    return {
        auditItems: [
            ...(createdAt
                ? [
                      {
                          date: createdAt,
                          label: 'Dibuat',
                          userName: createdByName,
                      },
                  ]
                : []),
            ...(updatedAt
                ? [
                      {
                          date: updatedAt,
                          label: 'Terakhir diperbarui',
                          userName: updatedByName,
                      },
                  ]
                : []),
        ],
        description: preview.description || 'Tulis deskripsi menu di sini.',
        fallbackImageLabel: 'Foto menu',
        images: preview.galleryImages ?? [],
        isActive: preview.isActive,
        isRecommended: preview.isRecommended,
        minOrder: preview.minOrder,
        name,
        price: {
            activePrice: hasPromo ? promoPrice : originalPrice,
            hasDiscount: hasPromo,
            originalPrice,
        },
        primaryImage: preview.primaryImage,
        subtitle: menuSubtitle(
            preview.categoryName || 'Kategori',
            preview.minOrder,
        ),
    };
}

export function menuDisplayDataFromItem(item: MenuItem): MenuDisplayData {
    return menuDisplayDataFromPreview(menuPreviewStateFromItem(item));
}

export function menuPreviewStateFromItem(item: MenuItem): MenuPreviewState {
    const activity = resolveActivity(item);

    return {
        activityDate: activity.date,
        activityType: activity.type,
        activityUserName: activity.userName,
        basePrice: stringifyPrice(item.base_price ?? item.price),
        categoryName: item.menu_category?.name ?? 'Tanpa kategori',
        createdAt: item.created_at ?? null,
        createdByName: item.creator?.name ?? '-',
        description: item.description ?? '',
        galleryImages: resolveGalleryImages(item),
        isActive: item.is_active ?? true,
        isRecommended: item.is_recommended ?? false,
        minOrder: String(item.min_order ?? 1),
        name: item.name ?? '',
        primaryImage: resolvePrimaryImage(item),
        promoPrice: stringifyPrice(item.promo_price),
        updatedAt: item.updated_at ?? null,
        updatedByName: item.updater?.name ?? item.creator?.name ?? '-',
    };
}

function resolveActivity(item: MenuItem): {
    date: string;
    type: 'created' | 'updated';
    userName: string;
} {
    const createdAt = parseActivityDate(item.created_at);
    const updatedAt = parseActivityDate(item.updated_at);
    const hasUpdate =
        updatedAt &&
        (!createdAt || updatedAt.getTime() !== createdAt.getTime());

    if (hasUpdate) {
        return {
            date: item.updated_at ?? new Date().toISOString(),
            type: 'updated',
            userName: item.updater?.name ?? item.creator?.name ?? '-',
        };
    }

    return {
        date: item.created_at ?? new Date().toISOString(),
        type: 'created',
        userName: item.creator?.name ?? item.updater?.name ?? '-',
    };
}

function parseActivityDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}

function resolvePrimaryImage(item: MenuItem): string | null {
    return (
        item.images?.find((image) => image.is_primary)?.image_url ??
        item.images?.[0]?.image_url ??
        item.primary_image ??
        null
    );
}

function resolveGalleryImages(
    item: MenuItem,
): MenuPreviewState['galleryImages'] {
    if (item.images && item.images.length > 0) {
        return [...item.images]
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((image) => ({
                alt: item.name ?? 'Foto menu',
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
            alt: item.name ?? 'Foto utama',
            id: 'primary-image',
            isPrimary: true,
            url: item.primary_image,
        },
    ];
}

function menuSubtitle(categoryName: string, minOrder: string): string {
    const trimmedCategoryName = categoryName.trim() || 'Kategori';
    const trimmedMinOrder = minOrder.trim();

    if (trimmedMinOrder === '' || trimmedMinOrder === '1') {
        return trimmedCategoryName;
    }

    return `${trimmedCategoryName} | Min. ${trimmedMinOrder} porsi`;
}
