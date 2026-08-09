import type { Errors } from '@inertiajs/core';
import type { UseFormSetError } from 'react-hook-form';

import type { CategoryFormValues } from '../schema/category-form-schema';

export const categoryFormServerFieldMap: Record<
    string,
    keyof CategoryFormValues
> = {
    icon: 'icon',
    is_active: 'isActive',
    name: 'name',
    type: 'type',
};

export function applyCategoryFormServerErrors(
    errors: Errors,
    setError: UseFormSetError<CategoryFormValues>,
): void {
    Object.entries(errors).forEach(([key, message]) => {
        const field = categoryFormServerFieldMap[key];

        if (!field) {
            return;
        }

        setError(field, {
            message: Array.isArray(message) ? message[0] : message,
            type: 'server',
        });
    });
}
