import type { VisitOptions } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { PackageCatalog } from '@/features/customers/components/customer-catalog';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type {
    CustomerCatalogItem,
    CustomerStorefrontProps,
} from '@/features/customers/types/customer-storefront-types';
import { customerCatalogItems } from '@/features/customers/utils/customer-catalog';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { menuDetail, packageDetail } from '@/routes/customerV2';

export default function CustomerV2PackagePage({
    menuItems,
    packages,
}: CustomerStorefrontProps) {
    const [selectedItem, setSelectedItem] =
        useState<CustomerCatalogItem | null>(null);
    const items = useMemo(
        () => customerCatalogItems(menuItems, packages),
        [menuItems, packages],
    );
    const cart = useCustomerCartStore(menuItems, packages);

    function addToCart(item: OrderFormItem): void {
        cart.add(item);
        setSelectedItem(null);
    }

    function handleQuickAdd(item: CustomerCatalogItem): void {
        setSelectedItem(item);
    }

    function handleViewDetail(item: CustomerCatalogItem): void {
        const detailOptions: VisitOptions = {
            preserveScroll: true,
            preserveState: true,
        };

        if (item.type === 'menu_item') {
            router.visit(
                menuDetail.url({ menuItem: item.item.id }),
                detailOptions,
            );
        } else {
            router.visit(
                packageDetail.url({ package: item.item.id }),
                detailOptions,
            );
        }
    }

    return (
        <>
            <Head title="Paket" />

            <div className="min-h-screen bg-background text-foreground">
                <PackageCatalog
                    items={items}
                    search=""
                    onAdd={handleQuickAdd}
                    onViewDetail={handleViewDetail}
                />

                {selectedItem?.type === 'menu_item' && (
                    <OrderConfirmDialog
                        key={selectedItem.id}
                        open
                        menuItem={selectedItem.item}
                        type="menu_item"
                        onConfirm={addToCart}
                        onOpenChange={(open) => !open && setSelectedItem(null)}
                    />
                )}
                {selectedItem?.type === 'package' && (
                    <OrderConfirmDialog
                        key={selectedItem.id}
                        open
                        packageItem={selectedItem.item}
                        type="package"
                        onConfirm={addToCart}
                        onOpenChange={(open) => !open && setSelectedItem(null)}
                    />
                )}
            </div>
        </>
    );
}

CustomerV2PackagePage.layout = {
    title: 'Paket',
    description: 'Lihat semua paket catering yang tersedia.',
};
