import type { OrderFormItem } from '@/features/orders/types/order-types';
import type { OrderMenuItem, OrderPackage, OrderPackageItem } from '@/types';

export function menuConfirmItem(
    menuItem: OrderMenuItem,
    item?: OrderFormItem | null,
): OrderFormItem {
    return {
        item_type: 'menu_item',
        menu_item_id: String(menuItem.id),
        package_id: '',
        qty: item?.qty ?? String(menuItem.min_order ?? 1),
        selected_items: [],
    };
}

export function packageConfirmItem(
    menuPackage: OrderPackage,
    item: OrderFormItem | null,
): OrderFormItem {
    const packageChoiceIds = new Set(
        menuPackage.items.flatMap((packageItem) =>
            packageItem.item_prices.map(
                (choice) =>
                    `${String(packageItem.id)}:${String(choice.menu_item_id)}`,
            ),
        ),
    );

    return {
        item_type: 'package',
        menu_item_id: '',
        package_id: String(menuPackage.id),
        qty: item?.qty ?? String(menuPackage.min_order ?? 1),
        selected_items:
            item?.selected_items.filter((selectedItem) =>
                packageChoiceIds.has(
                    `${selectedItem.package_item_id}:${selectedItem.menu_item_id}`,
                ),
            ) ?? [],
    };
}

export function selectedChoiceMenuItemId(
    item: OrderFormItem | null | undefined,
    packageItem: OrderPackageItem,
): string {
    return (
        item?.selected_items.find(
            (selectedItem) =>
                selectedItem.package_item_id === String(packageItem.id),
        )?.menu_item_id ?? ''
    );
}

export function toggleSelectedPackageChoice(
    item: OrderFormItem,
    packageItemId: string,
    menuItemId: string,
) {
    const currentSelection = item.selected_items.find(
        (selectedItem) => selectedItem.package_item_id === packageItemId,
    );
    const otherSelections = item.selected_items.filter(
        (selectedItem) => selectedItem.package_item_id !== packageItemId,
    );

    if (currentSelection?.menu_item_id === menuItemId) {
        return otherSelections;
    }

    return [
        ...otherSelections,
        { menu_item_id: menuItemId, package_item_id: packageItemId },
    ];
}
