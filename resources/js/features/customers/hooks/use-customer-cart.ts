import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { orderFormItemUnitPrice } from '@/features/orders/utils/order-form-values';
import { formatOrderItemPriceSummary } from '@/features/orders/utils/order-format';
import type { OrderMenuItem, OrderPackage } from '@/types';
import {
    getCartItems,
    subscribeCartStore,
    updateCartItems,
} from '../context/customer-cart-store';
import {
    customerCartItemKey,
    customerCartPackageContents,
} from '../utils/customer-catalog';
import type { CustomerCartPackageContent } from '../utils/customer-catalog';

export type CustomerCartLine = {
    categoryName: string;
    image: string | null;
    item: OrderFormItem;
    key: string;
    minimumOrder: number;
    name: string;
    packageContents: CustomerCartPackageContent[];
    quantity: number;
    subtotal: number;
    subtotalDetail: string;
    unitPrice: number;
};

// Normalization only needs to happen once per app session.
let cartNormalized = false;

export function useCustomerCart(
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
) {
    const [items, setItems] = useState<OrderFormItem[]>(() => getCartItems());
    const menuItemsRef = useRef(menuItems);
    const packagesRef = useRef(packages);

    // Keep refs up-to-date so the normalization effect can use latest data.
    useEffect(() => {
        menuItemsRef.current = menuItems;
        packagesRef.current = packages;
    }, [menuItems, packages]);

    // Normalize stored items once per session (filter stale/invalid entries).
    useEffect(() => {
        if (cartNormalized) {
            return;
        }

        cartNormalized = true;

        const normalized = normalizeStoredCustomerCartItems(
            getCartItems(),
            menuItemsRef.current,
            packagesRef.current,
        );

        updateCartItems(() => normalized);
        // Intentionally runs once on mount only.
    }, []);

    // Sync local state from the module-level store whenever it changes.
    useEffect(() => {
        return subscribeCartStore(() => {
            setItems(getCartItems());
        });
    }, []);

    const lines = useMemo<CustomerCartLine[]>(
        () => items.map((item) => customerCartLine(item, menuItems, packages)),
        [items, menuItems, packages],
    );

    function add(item: OrderFormItem): void {
        const key = customerCartItemKey(item);

        updateCartItems((currentItems) => {
            const existingIndex = currentItems.findIndex(
                (currentItem) => customerCartItemKey(currentItem) === key,
            );

            if (existingIndex === -1) {
                return [...currentItems, item];
            }

            return currentItems.map((currentItem, index) =>
                index === existingIndex
                    ? {
                          ...currentItem,
                          qty: String(
                              Number(currentItem.qty) + Number(item.qty),
                          ),
                      }
                    : currentItem,
            );
        });
    }

    function changeQuantity(key: string, amount: number): void {
        updateCartItems((currentItems) =>
            currentItems.map((item) => {
                if (customerCartItemKey(item) !== key) {
                    return item;
                }

                const minimumOrder = customerCartItemMinimumOrder(
                    item,
                    menuItems,
                    packages,
                );
                const quantity = customerCartItemQuantity(
                    item.qty,
                    minimumOrder,
                );

                return {
                    ...item,
                    qty: String(Math.max(minimumOrder, quantity + amount)),
                };
            }),
        );
    }

    function setQuantity(key: string, value: string): void {
        updateCartItems((currentItems) =>
            currentItems.map((item) => {
                if (customerCartItemKey(item) !== key) {
                    return item;
                }

                const minimumOrder = customerCartItemMinimumOrder(
                    item,
                    menuItems,
                    packages,
                );
                const quantity = Number(value);

                return {
                    ...item,
                    qty: String(
                        Number.isFinite(quantity)
                            ? Math.max(minimumOrder, Math.floor(quantity))
                            : minimumOrder,
                    ),
                };
            }),
        );
    }

    function remove(key: string): void {
        updateCartItems((currentItems) =>
            currentItems.filter((item) => customerCartItemKey(item) !== key),
        );
    }

    const clear = useCallback((): void => {
        updateCartItems(() => []);
    }, []);

    return {
        add,
        changeQuantity,
        clear,
        count: items.length,
        items,
        lines,
        remove,
        setQuantity,
        total: lines.reduce((total, line) => total + line.subtotal, 0),
    };
}

export function customerCartLine(
    item: OrderFormItem,
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): CustomerCartLine {
    const key = customerCartItemKey(item);
    const menuItem =
        item.item_type === 'menu_item'
            ? menuItems.find(
                  (currentMenuItem) =>
                      String(currentMenuItem.id) === item.menu_item_id,
              )
            : undefined;
    const packageItem =
        item.item_type === 'package'
            ? packages.find(
                  (currentPackage) =>
                      String(currentPackage.id) === item.package_id,
              )
            : undefined;
    const source = menuItem ?? packageItem;
    const minimumOrder = source?.min_order ?? 1;
    const quantity = customerCartItemQuantity(item.qty, minimumOrder);
    const unitPrice = orderFormItemUnitPrice(item, menuItems, packages);

    return {
        categoryName:
            menuItem?.menu_category?.name ??
            packageItem?.package_category?.name ??
            (item.item_type === 'package' ? 'Paket' : 'Menu'),
        image: source?.primary_image ?? null,
        item,
        key,
        minimumOrder,
        name: source?.name ?? 'Item catering',
        packageContents: packageItem
            ? customerCartPackageContents(item, packageItem)
            : [],
        quantity,
        subtotal: unitPrice * quantity,
        subtotalDetail: formatOrderItemPriceSummary(unitPrice, quantity),
        unitPrice,
    };
}

function normalizeStoredCustomerCartItems(
    value: unknown,
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): OrderFormItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((candidate): OrderFormItem[] => {
        if (!isRecord(candidate)) {
            return [];
        }

        const itemType = candidate.item_type;
        const menuItemId = stringValue(candidate.menu_item_id);
        const packageId = stringValue(candidate.package_id);
        const source =
            itemType === 'menu_item'
                ? menuItems.find((item) => String(item.id) === menuItemId)
                : itemType === 'package'
                  ? packages.find((item) => String(item.id) === packageId)
                  : undefined;

        if (!source || (itemType !== 'menu_item' && itemType !== 'package')) {
            return [];
        }

        const minimumOrder = source.min_order ?? 1;
        const quantity = customerCartItemQuantity(
            stringValue(candidate.qty),
            minimumOrder,
        );
        const selectedItems = Array.isArray(candidate.selected_items)
            ? candidate.selected_items.flatMap((selectedItem) => {
                  if (!isRecord(selectedItem)) {
                      return [];
                  }

                  const packageItemId = stringValue(
                      selectedItem.package_item_id,
                  );
                  const selectedMenuItemId = stringValue(
                      selectedItem.menu_item_id,
                  );

                  return packageItemId && selectedMenuItemId
                      ? [
                            {
                                menu_item_id: selectedMenuItemId,
                                package_item_id: packageItemId,
                            },
                        ]
                      : [];
              })
            : [];

        return [
            {
                item_type: itemType,
                menu_item_id: itemType === 'menu_item' ? menuItemId : '',
                package_id: itemType === 'package' ? packageId : '',
                qty: String(quantity),
                selected_items: selectedItems,
            },
        ];
    });
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown): string {
    return typeof value === 'string' || typeof value === 'number'
        ? String(value)
        : '';
}

function customerCartItemMinimumOrder(
    item: OrderFormItem,
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): number {
    return item.item_type === 'package'
        ? (packages.find(
              (packageItem) => String(packageItem.id) === item.package_id,
          )?.min_order ?? 1)
        : (menuItems.find(
              (menuItem) => String(menuItem.id) === item.menu_item_id,
          )?.min_order ?? 1);
}

function customerCartItemQuantity(value: string, minimumOrder: number): number {
    const quantity = Number(value);

    return Number.isFinite(quantity) && quantity > 0
        ? Math.floor(quantity)
        : minimumOrder;
}
