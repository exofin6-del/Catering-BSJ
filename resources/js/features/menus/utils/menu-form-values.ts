import type { FormDataConvertible } from '@inertiajs/core';

import type { MenuCategory, MenuItem } from '@/types';
import { NO_CATEGORY_VALUE } from '../components/form/constants';
import type { MenuFormValues } from '../schema/menu-form-schema';
import type { MenuImagePreview } from '../types/menu-types';
import { buildMenuImageSubmitPayload } from './menu-format';

export function createMenuFormDefaultValues(
    item?: MenuItem | null,
): MenuFormValues {
    return {
        basePrice: stringValue(item?.base_price),
        categoryId: item?.menu_category?.id
            ? String(item.menu_category.id)
            : NO_CATEGORY_VALUE,
        categoryIcon: item?.menu_category?.icon ?? '',
        categoryName: '',
        description: item?.description ?? '',
        isActive: item?.is_active ?? true,
        isRecommended: item?.is_recommended ?? false,
        minOrder: String(item?.min_order ?? 1),
        name: item?.name ?? '',
        promoPrice: stringValue(item?.promo_price),
    };
}

export function resolveSelectedCategory(
    categories: MenuCategory[],
    values: MenuFormValues,
): string {
    if (values.categoryName.trim() !== '') {
        return values.categoryName.trim();
    }

    return (
        categories.find((category) => String(category.id) === values.categoryId)
            ?.name ?? 'Tanpa kategori'
    );
}

export function buildMenuFormPayload(
    values: MenuFormValues,
    images: MenuImagePreview[] = [],
    removedImageIds: number[] = [],
): Record<string, FormDataConvertible> {
    const categoryName = values.categoryName.trim();
    const payload: Record<string, FormDataConvertible> = {
        base_price: values.basePrice,
        description: values.description.trim() || null,
        is_active: values.isActive,
        is_recommended: values.isRecommended,
        menu_category_id:
            categoryName !== '' || values.categoryId === NO_CATEGORY_VALUE
                ? null
                : Number(values.categoryId),
        menu_category_icon:
            categoryName !== '' || values.categoryId !== NO_CATEGORY_VALUE
                ? values.categoryIcon || null
                : null,
        menu_category_name: categoryName || null,
        min_order: Number(values.minOrder),
        name: values.name.trim(),
        promo_price: values.promoPrice.trim() || null,
        ...buildMenuImageSubmitPayload(images, removedImageIds),
    };

    return payload;
}

function stringValue(value: MenuItem['base_price'] | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
}
