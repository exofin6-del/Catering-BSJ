import { OrderCatalogDialog } from '@/features/orders/components/form/steps/order-items-step';
import type { CatalogSelection } from '@/features/orders/components/form/steps/order-items-step';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import type { CustomerCatalogItem } from '../types/customer-storefront-types';

const EMPTY_ORDER_ITEMS: OrderFormItem[] = [];

type CustomerMobileSearchDialogProps = {
    items: CustomerCatalogItem[];
    onOpenChange: (open: boolean) => void;
    onSelect: (item: CustomerCatalogItem) => void;
    open: boolean;
};

export function CustomerMobileSearchDialog({
    items,
    onOpenChange,
    onSelect,
    open,
}: CustomerMobileSearchDialogProps) {
    const menuItems = items.flatMap((item) =>
        item.type === 'menu_item' ? [item.item] : [],
    );
    const packages = items.flatMap((item) =>
        item.type === 'package' ? [item.item] : [],
    );

    function handleSelect(selection: CatalogSelection): void {
        onOpenChange(false);

        if (selection.type === 'menu_item') {
            onSelect({
                id: `menu-${selection.menuItem.id}`,
                item: selection.menuItem,
                type: 'menu_item',
            });

            return;
        }

        onSelect({
            id: `package-${selection.packageItem.id}`,
            item: selection.packageItem,
            type: 'package',
        });
    }

    return (
        <OrderCatalogDialog
            open={open}
            description="Cari menu atau paket lalu buka halaman detailnya."
            items={EMPTY_ORDER_ITEMS}
            menuItems={menuItems}
            packages={packages}
            onOpenChange={onOpenChange}
            onSelect={handleSelect}
        />
    );
}
