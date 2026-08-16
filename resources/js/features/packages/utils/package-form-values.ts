import type { FormDataConvertible } from '@inertiajs/core';

import type {
    MenuPackage,
    PackageCategory,
    PackageMenuItem,
    PriceValue,
} from '@/types';
import type {
    PackageChoiceFormItem,
    PackageComponentFormItem,
    PackageComponentPayload,
    PackageDetailsFormState,
    PackageImagePreview,
    PackagePreviewState,
    PackagePriceMode,
} from '../types/package-types';
import {
    hasMenuItemPromo,
    menuItemBasePrice,
    menuItemPromoPrice,
    priceNumber,
    stringifyPrice,
} from './package-price';

export function createPackagePreviewId(seed = 'package'): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${seed}`;
}

export function createFilePreviewId(file: File): string {
    return (
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${file.name}-${file.size}`
    );
}

export function findMenuItem(
    menuItems: PackageMenuItem[],
    id: string,
): PackageMenuItem | null {
    return menuItems.find((item) => String(item.id) === id) ?? null;
}

export function packagePriceForMode(
    item: PackageMenuItem | null,
    priceMode: PackagePriceMode,
    currentCustomPrice = '',
): string {
    if (priceMode === 'custom') {
        return currentCustomPrice;
    }

    if (priceMode === 'promo') {
        return menuItemPromoPrice(item) || menuItemBasePrice(item);
    }

    return menuItemBasePrice(item);
}

export function inferPackagePriceState(
    item: PackageMenuItem | null,
    savedPrice: PriceValue,
): {
    packagePrice: string;
    priceMode: PackagePriceMode;
} {
    if (savedPrice === null || savedPrice === undefined || savedPrice === '') {
        return {
            packagePrice: menuItemBasePrice(item),
            priceMode: 'normal',
        };
    }

    const packagePrice = stringifyPrice(savedPrice);
    const savedPriceNumber = priceNumber(savedPrice);

    if (savedPriceNumber === priceNumber(item?.base_price)) {
        return {
            packagePrice,
            priceMode: 'normal',
        };
    }

    if (
        hasMenuItemPromo(item) &&
        savedPriceNumber === priceNumber(item?.promo_price)
    ) {
        return {
            packagePrice,
            priceMode: 'promo',
        };
    }

    return {
        packagePrice,
        priceMode: 'custom',
    };
}

export function initialPackageDetails(
    item: MenuPackage | null,
): PackageDetailsFormState {
    return {
        description: item?.description ?? '',
        isActive: item?.is_active ?? true,
        isRecommended: item?.is_recommended ?? false,
        minOrder: String(item?.min_order ?? 1),
        name: item?.name ?? '',
        packageCategoryId: item?.package_category_id
            ? String(item.package_category_id)
            : '',
        packageCategoryIcon: item?.package_category?.icon ?? '',
        packageCategoryName: '',
    };
}

export function resolveSelectedPackageCategory(
    categories: PackageCategory[],
    values: PackageDetailsFormState,
): string {
    if (values.packageCategoryName.trim() !== '') {
        return values.packageCategoryName.trim();
    }

    return (
        categories.find(
            (category) => String(category.id) === values.packageCategoryId,
        )?.name ?? 'Tanpa kategori'
    );
}

export function initialPackageImages(
    item: MenuPackage | null,
): PackageImagePreview[] {
    if (item?.images && item.images.length > 0) {
        return [...item.images]
            .sort((first, second) => first.sort_order - second.sort_order)
            .map((image, index) => ({
                existingId: image.id,
                id: `existing-${image.id}`,
                isPrimary: index === 0,
                name: item.name ?? 'Foto paket',
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
            name: item.name ?? 'Foto paket',
            url: item.primary_image,
        },
    ];
}

export function initialPackageComponents(
    item: MenuPackage | null,
    menuItems: PackageMenuItem[],
): PackageComponentFormItem[] {
    return (
        item?.items.map((component) => {
            const isChoice = component.item_prices.length > 0;
            const menuItemId = component.menu_item_id
                ? String(component.menu_item_id)
                : '';
            const menuItem = findMenuItem(menuItems, menuItemId);
            const componentPrice = inferPackagePriceState(
                menuItem,
                component.package_price,
            );

            return {
                id: `existing-${component.id}`,
                isRecommended: component.is_recommended,
                itemPrices: component.item_prices.map((itemPrice) => ({
                    id: `existing-price-${itemPrice.id}`,
                    isRecommended: itemPrice.is_recommended,
                    menuItemId: String(itemPrice.menu_item_id),
                    ...inferPackagePriceState(
                        findMenuItem(menuItems, String(itemPrice.menu_item_id)),
                        itemPrice.package_price,
                    ),
                })),
                maxSelect: isChoice ? '1' : String(component.max_select ?? 1),
                menuItemId,
                minSelect: isChoice ? '1' : String(component.min_select ?? 1),
                name:
                    component.name ??
                    component.menu_item?.name ??
                    (isChoice ? 'Pilihan Paket' : ''),
                packagePrice: isChoice ? '' : componentPrice.packagePrice,
                priceMode: isChoice ? 'normal' : componentPrice.priceMode,
                type: isChoice ? 'choice' : 'fixed',
            };
        }) ?? []
    );
}

export function createFixedComponent(
    menuItem: PackageMenuItem,
): PackageComponentFormItem {
    return {
        id: createPackagePreviewId('fixed'),
        isRecommended: false,
        itemPrices: [],
        maxSelect: '1',
        menuItemId: String(menuItem.id),
        minSelect: '1',
        name: menuItem.name,
        packagePrice: menuItemBasePrice(menuItem),
        priceMode: 'normal',
        type: 'fixed',
    };
}

export function createChoiceItemFromMenuItem(
    menuItem: PackageMenuItem,
): PackageChoiceFormItem {
    return {
        id: createPackagePreviewId('choice-item'),
        isRecommended: false,
        menuItemId: String(menuItem.id),
        packagePrice: menuItemBasePrice(menuItem),
        priceMode: 'normal',
    };
}

export function selectedPackageComponentMenuItemIds(
    components: PackageComponentFormItem[],
): number[] {
    return components.flatMap(selectedPackageComponentItemMenuItemIds);
}

export function selectedPackageComponentItemMenuItemIds(
    component: PackageComponentFormItem,
): number[] {
    if (component.type === 'choice') {
        return component.itemPrices
            .map((choice) => Number(choice.menuItemId))
            .filter((id) => id > 0);
    }

    const menuItemId = Number(component.menuItemId);

    return menuItemId > 0 ? [menuItemId] : [];
}

export function buildPackageComponentPayload(
    components: PackageComponentFormItem[],
): PackageComponentPayload[] {
    return components.map((component) => {
        if (component.type === 'choice') {
            const validChoices = component.itemPrices
                .filter((choice) => choice.menuItemId !== '')
                .map((choice) => ({
                    is_recommended: choice.isRecommended,
                    menu_item_id: Number(choice.menuItemId),
                    package_price: choice.packagePrice || null,
                }));

            return {
                is_recommended: false,
                item_prices: validChoices,
                max_select: 1,
                menu_item_id: validChoices[0]?.menu_item_id ?? null,
                min_select: 1,
                name: component.name || null,
            };
        }

        return {
            is_recommended: false,
            menu_item_id: component.menuItemId
                ? Number(component.menuItemId)
                : null,
            name: component.name || null,
            package_price: component.packagePrice || null,
        };
    });
}

export function buildPackageFormPayload(
    values: PackageDetailsFormState,
    components: PackageComponentFormItem[],
    images: PackageImagePreview[] = [],
    removedImageIds: number[] = [],
): Record<string, FormDataConvertible> {
    const packageCategoryName = values.packageCategoryName.trim();

    return {
        description: values.description.trim() || null,
        is_active: values.isActive,
        is_recommended: values.isRecommended,
        min_order: Number(values.minOrder),
        name: values.name.trim(),
        package_category_id:
            packageCategoryName !== '' || values.packageCategoryId === ''
                ? null
                : Number(values.packageCategoryId),
        package_category_icon:
            packageCategoryName !== '' || values.packageCategoryId !== ''
                ? values.packageCategoryIcon || null
                : null,
        package_category_name: packageCategoryName || null,
        package_components: buildPackageComponentPayload(
            components,
        ) as unknown as FormDataConvertible,
        ...buildPackageImageSubmitPayload(images, removedImageIds),
    };
}

export function buildPackageImageSubmitPayload(
    images: PackageImagePreview[],
    removedImageIds: number[] = [],
): {
    primary_image_id: number | null;
    primary_temporary_image_id: string | null;
    removed_image_ids: number[];
    temporary_image_ids: string[];
} {
    const temporaryImageIds = images
        .map((image) => image.temporaryId)
        .filter((id): id is string => Boolean(id));

    return {
        primary_image_id:
            images.find((image) => image.isPrimary)?.existingId ?? null,
        primary_temporary_image_id:
            images.find((image) => image.isPrimary)?.temporaryId ??
            temporaryImageIds[0] ??
            null,
        removed_image_ids: removedImageIds,
        temporary_image_ids: temporaryImageIds,
    };
}

export function revokeObjectUrl(url: string): void {
    if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}

export function packagePreviewStateFromForm({
    categoryName,
    components,
    images,
    menuItems,
    values,
}: {
    categoryName: string;
    components: PackageComponentFormItem[];
    images: PackageImagePreview[];
    menuItems: PackageMenuItem[];
    values: PackageDetailsFormState;
}): PackagePreviewState {
    const previewComponents = components.map((component) => {
        if (component.type === 'choice') {
            const options = component.itemPrices.map((choice) => {
                const menuItem = findMenuItem(menuItems, choice.menuItemId);
                const activePrice = priceNumber(
                    choice.packagePrice ||
                        menuItem?.promo_price ||
                        menuItem?.base_price,
                );
                const originalPrice = priceNumber(menuItem?.base_price);

                return {
                    activePrice,
                    hasDiscount:
                        originalPrice > 0 && activePrice < originalPrice,
                    id: choice.id,
                    isRecommended: choice.isRecommended,
                    name: menuItem?.name ?? 'Pilihan menu',
                    originalPrice,
                    menuItemId: choice.menuItemId,
                };
            });
            const lowestOption = lowestDisplayPreviewOption(options);

            return {
                activePrice: lowestOption?.activePrice ?? 0,
                hasDiscount: options.some((option) => option.hasDiscount),
                id: component.id,
                isChoice: true,
                name: component.name || 'Pilihan Paket',
                options,
                originalPrice: lowestOption?.originalPrice ?? 0,
                menuItemId: component.menuItemId,
            };
        }

        const menuItem = findMenuItem(menuItems, component.menuItemId);
        const activePrice = priceNumber(
            component.packagePrice ||
                menuItem?.promo_price ||
                menuItem?.base_price,
        );
        const originalPrice = priceNumber(menuItem?.base_price);

        return {
            activePrice,
            hasDiscount: originalPrice > 0 && activePrice < originalPrice,
            id: component.id,
            isChoice: false,
            name: component.name || menuItem?.name || 'Komponen paket',
            options: [],
            originalPrice,
            menuItemId: component.menuItemId,
        };
    });
    const totalActivePrice = previewComponents.reduce(
        (total, component) => total + priceNumber(component.activePrice),
        0,
    );
    const totalPrice = previewComponents.reduce(
        (total, component) => total + priceNumber(component.originalPrice),
        0,
    );

    return {
        categoryName,
        components: previewComponents,
        description: values.description,
        galleryImages: images.map((image) => ({
            alt: values.name || image.name || 'Foto paket',
            id: image.id,
            isPrimary: image.isPrimary,
            url: image.url,
        })),
        isActive: values.isActive,
        isRecommended: values.isRecommended,
        minOrder: values.minOrder,
        name: values.name,
        primaryImage:
            images.find((image) => image.isPrimary)?.url ??
            images[0]?.url ??
            null,
        totalActivePrice,
        totalHasDiscount:
            totalPrice > 0 &&
            totalActivePrice > 0 &&
            totalActivePrice < totalPrice,
        totalPrice,
        totalStartsFrom: previewComponents.some(
            (component) => component.isChoice,
        ),
    };
}

function lowestDisplayPreviewOption<
    Option extends { activePrice: PriceValue; originalPrice: PriceValue },
>(options: Option[]): Option | null {
    if (options.length === 0) {
        return null;
    }

    const pricedOptions = options.filter(
        (option) => priceNumber(option.activePrice) > 0,
    );

    return (pricedOptions.length > 0 ? pricedOptions : options).reduce(
        (lowest, option) => {
            const optionActivePrice = priceNumber(option.activePrice);
            const lowestActivePrice = priceNumber(lowest.activePrice);

            if (optionActivePrice < lowestActivePrice) {
                return option;
            }

            if (
                optionActivePrice === lowestActivePrice &&
                priceNumber(option.originalPrice) >
                    priceNumber(lowest.originalPrice)
            ) {
                return option;
            }

            return lowest;
        },
    );
}
