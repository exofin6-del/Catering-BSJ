import { router, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppContent } from '@/components/shared/app-shell/app-content';
import { AppShell } from '@/components/shared/app-shell/app-shell';
import { Button } from '@/components/ui/button';
import { Command, CommandInput } from '@/components/ui/command';
import { CustomerCartSheet } from '@/features/customers/components/customer-cart-sheet';
import { CustomerFooter } from '@/features/customers/components/customer-footer';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';
import { cn } from '@/lib/utils';
import { checkout, search } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage, SharedData } from '@/types';

type Props = {
    children: ReactNode;
    backHref?: string;
    backLabel?: string;
};

export default function CustomerSearchLayout({
    children,
    backHref = '/',
    backLabel = 'Kembali',
}: Props) {
    useCustomerTheme();
    const page = usePage<SharedData>();
    const {
        business,
        menuItems = [],
        packages = [],
        query = '',
    } = page.props as {
        business?: CustomerBusiness;
        menuItems?: OrderMenuItem[];
        packages?: OrderPackage[];
        query?: string;
    };
    const cart = useCustomerCartStore(menuItems, packages);
    const [searchValue, setSearchValue] = useState(query);

    function handleSearchSubmit(value: string): void {
        const trimmed = value.trim();

        if (trimmed) {
            router.visit(search.url({ query: { q: trimmed } }), {
                preserveScroll: false,
            });
        }
    }

    return (
        <AppShell variant="header">
            <header
                className={cn(
                    'sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)] text-foreground transition-all duration-300',
                )}
            >
                <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute left-4 size-9 rounded-full bg-primary/10 text-primary sm:left-6 lg:left-8"
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

                    <div className="w-full pl-12 sm:mx-auto sm:max-w-xl sm:pl-0">
                        <Command
                            shouldFilter={false}
                            className="min-w-0 border-0 p-0"
                        >
                            <CommandInput
                                value={searchValue}
                                placeholder="Cari menu atau paket..."
                                wrapperClassName="min-w-0 p-0"
                                inputGroupClassName="h-10! rounded-full! border-primary/15 bg-primary/[0.03] text-foreground shadow-none! placeholder:text-muted-foreground/50 focus-within:border-primary/30 focus-within:ring-primary/20 **:[data-slot=input-group-addon]:pl-4! **:[data-slot=input-group-addon]:pr-2! **:[data-slot=input-group-addon]:text-primary [&_svg]:size-4! [&_svg]:opacity-100"
                                onValueChange={setSearchValue}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleSearchSubmit(searchValue);
                                    }
                                }}
                            />
                        </Command>
                    </div>
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
