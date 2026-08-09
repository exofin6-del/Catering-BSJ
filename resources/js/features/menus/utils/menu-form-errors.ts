import type { Errors } from '@inertiajs/core';
import type { UseFormSetError } from 'react-hook-form';

import {
    menuFormStepFields,
    menuFormSteps,
} from '../components/form/constants';
import type { MenuFormValues } from '../schema/menu-form-schema';

export const menuFormServerFieldMap: Record<string, keyof MenuFormValues> = {
    base_price: 'basePrice',
    description: 'description',
    is_active: 'isActive',
    is_recommended: 'isRecommended',
    menu_category_id: 'categoryName',
    menu_category_name: 'categoryName',
    min_order: 'minOrder',
    name: 'name',
    promo_price: 'promoPrice',
};

export function applyMenuFormServerErrors(
    errors: Errors,
    setError: UseFormSetError<MenuFormValues>,
): void {
    Object.entries(errors).forEach(([key, message]) => {
        const field = menuFormServerFieldMap[key];

        if (!field) {
            return;
        }

        setError(field, {
            message: Array.isArray(message) ? message[0] : message,
            type: 'server',
        });
    });
}

export function applyImageServerError(
    errors: Errors,
    setImageError: (message: string | null) => void,
): void {
    const imageError = Object.entries(errors).find(([key]) =>
        isImageErrorKey(key),
    )?.[1];

    if (!imageError) {
        return;
    }

    setImageError(Array.isArray(imageError) ? imageError[0] : imageError);
}

export function resolveFirstMenuFormErrorStepIndex(errors: Errors): number {
    if (Object.keys(errors).some((key) => isImageErrorKey(key))) {
        return menuFormSteps.findIndex((step) => step.id === 'publish');
    }

    const clientKeys = Object.keys(errors)
        .map((key) => menuFormServerFieldMap[key])
        .filter((key): key is keyof MenuFormValues => key !== undefined);

    return menuFormSteps.findIndex((step) =>
        menuFormStepFields[step.id].some((field) => clientKeys.includes(field)),
    );
}

function isImageErrorKey(key: string): boolean {
    return [
        'image',
        'primary_image_id',
        'primary_temporary_image_id',
        'removed_image_ids',
        'temporary_image_id',
        'temporary_image_ids',
    ].some((imageKey) => key === imageKey || key.startsWith(`${imageKey}.`));
}
