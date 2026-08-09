import type { FormDataConvertible } from '@inertiajs/core';

import type { CategoryRecord, CategoryType } from '@/types';
import type { CategoryFormValues } from '../schema/category-form-schema';

export function createCategoryFormDefaultValues({
    category,
    initialType = 'menu',
}: {
    category?: CategoryRecord | null;
    initialType?: CategoryType;
}): CategoryFormValues {
    return {
        icon: category?.icon ?? '',
        isActive: category?.is_active ?? true,
        name: category?.name ?? '',
        type: category?.type ?? initialType,
    };
}

export function buildCategoryFormPayload(
    values: CategoryFormValues,
    { includeType = false }: { includeType?: boolean } = {},
): Record<string, FormDataConvertible> {
    const payload: Record<string, FormDataConvertible> = {
        icon: values.icon.trim() || null,
        is_active: values.isActive,
        name: values.name.trim(),
    };

    if (includeType) {
        payload.type = values.type;
    }

    return payload;
}
