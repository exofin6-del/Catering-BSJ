import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import { AppContent } from '@/components/shared/app-shell/app-content';
import { AppHeader } from '@/components/shared/app-shell/app-header';
import { AppShell } from '@/components/shared/app-shell/app-shell';
import { CustomerCartSheet } from '@/features/customers/components/customer-cart-sheet';
import { CustomerFooter } from '@/features/customers/components/customer-footer';
import { CustomerWhatsAppButton } from '@/features/customers/components/customer-whatsapp-button';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';
import { useScrollRestoration } from '@/lib/hooks/use-scroll-restoration';
import { checkout } from '@/routes/customerV2';
import type {
    AppLayoutProps,
    OrderMenuItem,
    OrderPackage,
    SharedData,
} from '@/types';

export default function CustomerLayout({ children }: AppLayoutProps) {
    const page = usePage<SharedData>();
    useCustomerTheme();
    useScrollRestoration();
    const { business, menuItems = [], packages = [] } = page.props as {
        business?: CustomerBusiness;
        menuItems?: OrderMenuItem[];
        packages?: OrderPackage[];
    };
    const [cartAnimationKey] = useState(0);
    const cart = useCustomerCartStore(menuItems, packages);

    return (
        <AppShell variant="header">
            <AppHeader
                cartAnimationKey={cartAnimationKey}
                cartCount={cart.count}
                menuItems={menuItems}
                packages={packages}
                onCartOpen={() => cart.setCartOpen(true)}
            />
            <AppContent variant="header">{children}</AppContent>
            {business ? <CustomerFooter business={business} /> : null}
            {business ? <CustomerWhatsAppButton business={business} /> : null}
            <CustomerCartSheet
                checkoutHref={checkout.url()}
                lines={cart.lines}
                open={cart.cartOpen}
                total={cart.total}
                onChangeQuantity={cart.changeQuantity}
                onOpenChange={cart.setCartOpen}
                onRemove={cart.remove}
                onSetQuantity={cart.setQuantity}
            />
        </AppShell>
    );
}
