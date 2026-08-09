import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import { CustomerInterestedSection } from '@/features/customers/components/customer-interested-section';
import { MenuDetailView } from '@/features/menus/components/menu-detail-view';
import { menuDisplayDataFromItem } from '@/features/menus/utils/menu-format';
import { resolveMenuPrice } from '@/features/menus/utils/menu-price';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import { PackageDetail } from '@/features/packages/components/shared/package-detail';
import CustomerDetailLayout from '@/layouts/customer/customer-detail-layout';
import { home } from '@/routes';
import type {
    MenuItem,
    MenuPackage,
    OrderMenuItem,
    OrderPackage,
} from '@/types';

export default function CustomerV2Detail({
    itemType,
    item,
    menuItems = [],
    packages = [],
}: {
    itemType: 'menu_item' | 'package';
    item: MenuItem | MenuPackage;
    menuItems?: OrderMenuItem[];
    packages?: OrderPackage[];
}) {
    const isMenu = itemType === 'menu_item';
    const [confirmOpen, setConfirmOpen] = useState(false);
    const cart = useCustomerCartStore(menuItems, packages);

    // Resolve complete object from storefront lists for full database attributes compatibility
    const resolvedMenuItem = isMenu
        ? menuItems.find((m) => m.id === item.id)
        : undefined;
    const resolvedPackage = !isMenu
        ? packages.find((p) => p.id === item.id)
        : undefined;

    function addToCart(orderItem: OrderFormItem): void {
        cart.add(orderItem);
        setConfirmOpen(false);
    }

    function handleAddToCart(): void {
        setConfirmOpen(true);
    }

    const primaryAction = (
        <Button className="w-full rounded-xl" onClick={handleAddToCart}>
            Tambah ke keranjang
        </Button>
    );

    return (
        <>
            <Head title={item?.name ? item.name : 'Detail Produk'} />
            <div className="@container/main mx-auto flex w-full max-w-7xl flex-col gap-6 py-6">
                {isMenu ? (
                    <MenuDetailView
                        categoryName={
                            (item as MenuItem).menu_category?.name ?? 'Menu'
                        }
                        display={menuDisplayDataFromItem(item as MenuItem)}
                        layoutMode="grid"
                        price={resolveMenuPrice(item as MenuItem)}
                        primaryAction={primaryAction}
                        showThumbnails={false}
                        showAbout={false}
                    />
                ) : (
                    <PackageDetail
                        item={item as MenuPackage}
                        layoutMode="grid"
                        showThumbnails={false}
                        showAbout={false}
                        primaryAction={primaryAction}
                    />
                )}
            </div>

            <CustomerInterestedSection
                currentItemId={item.id ?? 0}
                currentItemType={isMenu ? 'menu_item' : 'package'}
                menuItems={menuItems}
                packages={packages}
            />

            {isMenu && resolvedMenuItem ? (
                <OrderConfirmDialog
                    open={confirmOpen}
                    menuItem={resolvedMenuItem}
                    type="menu_item"
                    onConfirm={addToCart}
                    onOpenChange={setConfirmOpen}
                />
            ) : null}
            {!isMenu && resolvedPackage ? (
                <OrderConfirmDialog
                    open={confirmOpen}
                    packageItem={resolvedPackage}
                    type="package"
                    onConfirm={addToCart}
                    onOpenChange={setConfirmOpen}
                />
            ) : null}
        </>
    );
}

CustomerV2Detail.layout = (page: React.ReactNode) => (
    <CustomerDetailLayout
        title="Detail Produk"
        backHref={home.url()}
        backLabel="Kembali ke Beranda"
    >
        {page}
    </CustomerDetailLayout>
);
