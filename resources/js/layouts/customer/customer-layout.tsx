import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AppContent } from '@/components/app-shell/app-content';
import { AppHeader } from '@/components/app-shell/app-header';
import { AppShell } from '@/components/app-shell/app-shell';
import { CustomerCartSheet } from '@/features/customers/components/customer-cart-sheet';
import { CustomerFooter } from '@/features/customers/components/customer-footer';
import { CustomerLoginDialog } from '@/features/customers/components/customer-login-dialog';
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
    const page = usePage<
        SharedData & {
            business: CustomerBusiness;
            menuItems?: OrderMenuItem[];
            packages?: OrderPackage[];
        }
    >();
    useCustomerTheme();
    useScrollRestoration();
    const { business, menuItems = [], packages = [] } = page.props;

    const [cartAnimationKey] = useState(0);
    const cart = useCustomerCartStore(menuItems, packages);
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        const handleShow = (): void => setLoginOpen(true);
        window.addEventListener('show-customer-login', handleShow);
        
        return () =>
            window.removeEventListener('show-customer-login', handleShow);
    }, []);

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
            <CustomerLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
        </AppShell>
    );
}
