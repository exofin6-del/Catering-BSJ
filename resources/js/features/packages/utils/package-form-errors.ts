import type { Errors } from '@inertiajs/core';
import type { UseFormSetError } from 'react-hook-form';

import type { PackageDetailsFormValues } from '../schema/package-form-schema';

export const packageFormServerFieldMap: Record<
    string,
    keyof PackageDetailsFormValues
> = {
    description: 'description',
    is_active: 'isActive',
    is_recommended: 'isRecommended',
    min_order: 'minOrder',
    name: 'name',
    package_category_id: 'packageCategoryId',
    package_category_name: 'packageCategoryName',
};

export function applyPackageFormServerErrors(
    errors: Errors,
    setError: UseFormSetError<PackageDetailsFormValues>,
): void {
    Object.entries(errors).forEach(([key, message]) => {
        const field = packageFormServerFieldMap[key];

        if (!field) {
            return;
        }

        setError(field, {
            message,
            type: 'server',
        });
    });
}

export function applyPackageImageServerError(
    errors: Errors,
    setImageError: (message: string | null) => void,
): void {
    const message = Object.entries(errors).find(([key]) =>
        [
            'image',
            'primary_image_id',
            'primary_temporary_image_id',
            'removed_image_ids',
            'temporary_image_ids',
        ].some((imageField) => key.startsWith(imageField)),
    )?.[1];

    if (message) {
        setImageError(message);
    }
}

export function resolvePackageComponentServerError(
    errors: Errors,
): string | null {
    return (
        Object.entries(errors).find(([key]) =>
            key.startsWith('package_components'),
        )?.[1] ?? null
    );
}

export function resolveFirstPackageFormErrorStepIndex(errors: Errors): number {
    const keys = Object.keys(errors);

    if (keys.some((key) => packageFormServerFieldMap[key])) {
        return 0;
    }

    if (keys.some((key) => key.startsWith('package_components'))) {
        return 1;
    }

    if (
        keys.some((key) =>
            [
                'image',
                'primary_image_id',
                'primary_temporary_image_id',
                'removed_image_ids',
                'temporary_image_ids',
            ].some((imageField) => key.startsWith(imageField)),
        )
    ) {
        return 2;
    }

    return 0;
}
