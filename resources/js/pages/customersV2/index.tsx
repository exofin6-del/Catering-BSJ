import type { VisitOptions } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { HomeCatalog } from '@/features/customers/components/customer-catalog';
import { CustomerHero } from '@/features/customers/components/customer-hero';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';
import type { CustomerCatalogItem } from '@/features/customers/types/customer-storefront-types';
import { customerCatalogItems } from '@/features/customers/utils/customer-catalog';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { menuCatalog, menuDetail, packageDetail } from '@/routes/customerV2';

export default function CustomerV2Index({
    business,
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

    function handleViewDetail(item: CustomerCatalogItem): void {
        const detailOptions: VisitOptions = {
            preserveScroll: false,
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

    function addToCart(item: OrderFormItem): void {
        cart.add(item);
        setSelectedItem(null);
    }

    function handleAdd(item: CustomerCatalogItem): void {
        setSelectedItem(item);
    }

    function handleCategoryNavigate(category: string): void {
        router.visit(
            `${menuCatalog.url()}?category=${encodeURIComponent(category)}`,
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    }

    return (
        <>
            <Head title="Beranda" />

            <div className="min-h-screen bg-background text-foreground">
                <CustomerHero business={business} items={items} />

                <HomeCatalog
                    items={items}
                    search=""
                    onAdd={handleAdd}
                    onViewDetail={handleViewDetail}
                    onCategoryNavigate={handleCategoryNavigate}
                />
            </div>

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
        </>
    );
}

CustomerV2Index.layout = {
    title: 'Beranda',
};
