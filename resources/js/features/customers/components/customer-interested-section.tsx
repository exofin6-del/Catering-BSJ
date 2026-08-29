import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { menuDetail, packageDetail } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage } from '@/types';
import type { CustomerCatalogItem } from '../types/customer-storefront-types';
import {
    customerCatalogItemCategory,
    customerCatalogItems,
} from '../utils/customer-catalog';
import { CatalogSectionMenu } from './customer-catalog';

const MAX_INTERESTED_ITEMS = 10;

export function CustomerInterestedSection({
    currentItemType,
    currentItemId,
    menuItems,
    packages,
}: {
    currentItemType: 'menu_item' | 'package';
    currentItemId: number;
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
}) {
    const cart = useCustomerCartStore(menuItems, packages);
    const [selectedItem, setSelectedItem] =
        useState<CustomerCatalogItem | null>(null);

    const interestedItems = useMemo(
        () =>
            customerInterestedItems(
                customerCatalogItems(menuItems, packages),
                currentItemType,
                currentItemId,
            ),
        [menuItems, packages, currentItemType, currentItemId],
    );

    function handleViewDetail(item: CustomerCatalogItem): void {
        const href =
            item.type === 'package'
                ? packageDetail.url({ package: item.item.id })
                : menuDetail.url({ menuItem: item.item.id });

        router.visit(href, {
            preserveScroll: true,
            preserveState: true,
        });
    }

    function handleConfirm(item: OrderFormItem): void {
        const added = cart.add(item);

        if (!added) {
            toast.error('Keranjang maksimal sepuluh jenis item.');

            return;
        }

        toast.success(
            selectedItem?.type === 'package'
                ? 'Paket ditambahkan ke keranjang.'
                : 'Menu ditambahkan ke keranjang.',
        );
        setSelectedItem(null);
    }

    if (interestedItems.length === 0) {
        return null;
    }

    return (
        <section className="border-t border-border/70 pt-2">
            <CatalogSectionMenu
                categories={[]}
                category="all"
                emptyLabel="Produk tidak ditemukan"
                items={interestedItems}
                previewLimit={MAX_INTERESTED_ITEMS}
                title="Anda mungkin tertarik"
                visibleCount={MAX_INTERESTED_ITEMS}
                showVisibilityControls={false}
                onAdd={setSelectedItem}
                onCategoryChange={() => {}}
                onShowLess={() => {}}
                onShowMore={() => {}}
                onViewDetail={handleViewDetail}
            />

            {selectedItem?.type === 'menu_item' ? (
                <OrderConfirmDialog
                    key={selectedItem.id}
                    open
                    menuItem={selectedItem.item}
                    type="menu_item"
                    onConfirm={handleConfirm}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            ) : null}
            {selectedItem?.type === 'package' ? (
                <OrderConfirmDialog
                    key={selectedItem.id}
                    open
                    packageItem={selectedItem.item}
                    type="package"
                    onConfirm={handleConfirm}
                    onOpenChange={(open) => !open && setSelectedItem(null)}
                />
            ) : null}
        </section>
    );
}

function customerInterestedItems(
    items: CustomerCatalogItem[],
    currentItemType: 'menu_item' | 'package',
    currentItemId: number,
): CustomerCatalogItem[] {
    const currentEntry = items.find(
        (entry) =>
            entry.type === currentItemType && entry.item.id === currentItemId,
    );
    const currentCategory = currentEntry
        ? customerCatalogItemCategory(currentEntry)
        : null;

    const scored = items
        .filter(
            (entry) =>
                !(
                    entry.type === currentItemType &&
                    entry.item.id === currentItemId
                ),
        )
        .map((entry, index) => {
            const category = customerCatalogItemCategory(entry);
            let score = 0;

            if (category && currentCategory && category === currentCategory) {
                score += 8;
            }

            if (entry.item.is_recommended) {
                score += 2;
            }

            return { entry, index, score };
        })
        .sort(
            (first, second) =>
                second.score - first.score || first.index - second.index,
        )
        .slice(0, MAX_INTERESTED_ITEMS)
        .map(({ entry }) => entry);

    return scored;
}
