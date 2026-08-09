import { usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppContent } from '@/components/shared/app-shell/app-content';
import { AppShell } from '@/components/shared/app-shell/app-shell';
import { Button } from '@/components/ui/button';
import { CustomerCartSheet } from '@/features/customers/components/customer-cart-sheet';
import { CustomerFooter } from '@/features/customers/components/customer-footer';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';
import { useScrollRestoration } from '@/lib/hooks/use-scroll-restoration';
import { cn } from '@/lib/utils';
import { checkout } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage, SharedData } from '@/types';

type Props = {
    children: ReactNode;
    title: string;
    backHref?: string;
    backLabel?: string;
};

export default function CustomerDetailLayout({
    children,
    title,
    backHref = '/',
    backLabel = 'Kembali',
}: Props) {
    useCustomerTheme();
    useScrollRestoration();
    const page = usePage<SharedData>();
    const { business, menuItems = [], packages = [] } = page.props as {
        business?: CustomerBusiness;
        menuItems?: OrderMenuItem[];
        packages?: OrderPackage[];
    };
    const cart = useCustomerCartStore(menuItems, packages);

    return (
        <AppShell variant="header">
            <header
                className={cn(
                    'sticky top-0 z-40 bg-background text-foreground transition-all duration-300',
                )}
            >
                <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-9 rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 active:scale-95"
                        onClick={() => {
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                window.location.href = backHref;
                            }
                        }}
                        aria-label={backLabel}
                    >
                        <ChevronLeft className="size-7" />
                    </Button>
                    <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold tracking-tight sm:static sm:translate-x-0">
                        {title}
                    </h1>
                </div>
            </header>
            <AppContent variant="header">{children}</AppContent>
            {business ? <CustomerFooter business={business} /> : null}
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
