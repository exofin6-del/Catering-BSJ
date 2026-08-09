import { usePersistentState } from '@/lib/hooks/use-persistent-state';

import type { MenuPackage, PackageMenuItem } from '@/types';
import type {
    PackageChoiceFormItem,
    PackageComponentFormItem,
} from '../types/package-types';
import {
    createChoiceItemFromMenuItem,
    createFixedComponent,
    findMenuItem,
    initialPackageComponents,
    selectedPackageComponentItemMenuItemIds,
} from '../utils/package-form-values';
import { menuItemBasePrice } from '../utils/package-price';

export function usePackageComponents({
    item = null,
    menuItems,
    storageKey,
}: {
    item?: MenuPackage | null;
    menuItems: PackageMenuItem[];
    storageKey: string;
}) {
    const [components, setComponents, clearComponents] = usePersistentState<
        PackageComponentFormItem[]
    >(storageKey, () => initialPackageComponents(item, menuItems));

    function addFixedComponent(menuItem: PackageMenuItem): void {
        setComponents((current) => {
            if (isMenuItemUsed(current, menuItem.id)) {
                return current;
            }

            return [...current, createFixedComponent(menuItem)];
        });
    }

    function removeComponent(componentId: string): void {
        setComponents((current) =>
            current.filter((component) => component.id !== componentId),
        );
    }

    function moveComponent(componentId: string, direction: -1 | 1): void {
        setComponents((current) => {
            const index = current.findIndex(
                (component) => component.id === componentId,
            );
            const targetIndex = index + direction;

            return moveItemByIndex(current, index, targetIndex);
        });
    }

    function updateComponent<Key extends keyof PackageComponentFormItem>(
        componentId: string,
        field: Key,
        value: PackageComponentFormItem[Key],
    ): void {
        setComponents((current) =>
            current.map((component) =>
                component.id === componentId
                    ? {
                          ...component,
                          [field]: value,
                      }
                    : component,
            ),
        );
    }

    function addChoiceMenuItem(
        componentId: string,
        menuItem: PackageMenuItem,
    ): void {
        setComponents((current) =>
            current.map((component) => {
                if (component.id !== componentId) {
                    return component;
                }

                if (isMenuItemUsed(current, menuItem.id)) {
                    return component;
                }

                const nextChoice = createChoiceItemFromMenuItem(menuItem);

                if (component.type === 'choice') {
                    return {
                        ...component,
                        itemPrices: [...component.itemPrices, nextChoice],
                        menuItemId:
                            component.menuItemId || nextChoice.menuItemId,
                    };
                }

                const selectedMenuItem = findMenuItem(
                    menuItems,
                    component.menuItemId,
                );
                const existingChoice = selectedMenuItem
                    ? {
                          id: `${component.id}-fixed-choice`,
                          isRecommended: component.isRecommended,
                          menuItemId: String(selectedMenuItem.id),
                          packagePrice:
                              component.packagePrice ||
                              menuItemBasePrice(selectedMenuItem),
                          priceMode: component.priceMode,
                      }
                    : null;
                const itemPrices = existingChoice
                    ? [existingChoice, nextChoice]
                    : [nextChoice];

                return {
                    ...component,
                    isRecommended: false,
                    itemPrices,
                    maxSelect: '1',
                    menuItemId: itemPrices[0]?.menuItemId ?? '',
                    minSelect: '1',
                    name: choiceGroupName(
                        itemPrices
                            .map((choice) =>
                                findMenuItem(menuItems, choice.menuItemId),
                            )
                            .filter(
                                (
                                    choiceMenuItem,
                                ): choiceMenuItem is PackageMenuItem =>
                                    choiceMenuItem !== null,
                            ),
                    ),
                    packagePrice: '',
                    priceMode: 'normal',
                    type: 'choice',
                };
            }),
        );
    }

    function removeChoiceItem(componentId: string, choiceId: string): void {
        setComponents((current) =>
            current.map((component) => {
                if (component.id !== componentId) {
                    return component;
                }

                const itemPrices = component.itemPrices.filter(
                    (choice) => choice.id !== choiceId,
                );

                if (component.type === 'choice' && itemPrices.length === 1) {
                    const remainingChoice = itemPrices[0];
                    const menuItem = findMenuItem(
                        menuItems,
                        remainingChoice.menuItemId,
                    );

                    return {
                        ...component,
                        isRecommended: false,
                        itemPrices: [],
                        maxSelect: '1',
                        menuItemId: remainingChoice.menuItemId,
                        minSelect: '1',
                        name: menuItem?.name ?? component.name,
                        packagePrice:
                            remainingChoice.packagePrice ||
                            menuItemBasePrice(menuItem),
                        priceMode: remainingChoice.priceMode,
                        type: 'fixed',
                    };
                }

                return {
                    ...component,
                    itemPrices,
                    menuItemId:
                        component.menuItemId === ''
                            ? (itemPrices[0]?.menuItemId ?? '')
                            : component.menuItemId,
                };
            }),
        );
    }

    function updateChoiceItem<Key extends keyof PackageChoiceFormItem>(
        componentId: string,
        choiceId: string,
        field: Key,
        value: PackageChoiceFormItem[Key],
    ): void {
        setComponents((current) =>
            current.map((component) =>
                component.id === componentId
                    ? {
                          ...component,
                          itemPrices: component.itemPrices.map((choice) =>
                              choice.id === choiceId
                                  ? {
                                        ...choice,
                                        [field]: value,
                                    }
                                  : choice,
                          ),
                      }
                    : component,
            ),
        );
    }

    return {
        addChoiceMenuItem,
        addFixedComponent,
        components,
        clearComponents,
        moveComponent,
        removeChoiceItem,
        removeComponent,
        updateChoiceItem,
        updateComponent,
    };
}

function isMenuItemUsed(
    components: PackageComponentFormItem[],
    menuItemId: number | string,
): boolean {
    const normalizedMenuItemId = Number(menuItemId);

    if (normalizedMenuItemId <= 0) {
        return false;
    }

    return components.some((component) =>
        selectedPackageComponentItemMenuItemIds(component).includes(
            normalizedMenuItemId,
        ),
    );
}

function moveItemByIndex<T>(
    items: T[],
    sourceIndex: number,
    targetIndex: number,
): T[] {
    if (
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= items.length ||
        targetIndex >= items.length
    ) {
        return items;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(sourceIndex, 1);

    if (movedItem === undefined) {
        return items;
    }

    nextItems.splice(targetIndex, 0, movedItem);

    return nextItems;
}

function choiceGroupName(menuItems: PackageMenuItem[]): string {
    const categoryNames = menuItems
        .map((menuItem) => menuItem.menu_category?.name)
        .filter((name): name is string => Boolean(name));
    const uniqueCategoryNames = [...new Set(categoryNames)];

    if (
        uniqueCategoryNames.length === 1 &&
        uniqueCategoryNames[0] !== undefined
    ) {
        return `Pilih 1 ${uniqueCategoryNames[0]}`;
    }

    return 'Pilihan Paket';
}
