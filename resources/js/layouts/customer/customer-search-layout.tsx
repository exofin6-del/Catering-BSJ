import { router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    Info,
    LayoutGrid,
    Package,
    Search,
    ShoppingCart,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AppContent } from '@/components/app-shell/app-content';
import { AppShell } from '@/components/app-shell/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomerCartSheet } from '@/features/customers/components/customer-cart-sheet';
import { CustomerFooter } from '@/features/customers/components/customer-footer';
import { useCustomerCartStore } from '@/features/customers/context/customer-cart-context';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import {
    checkout,
    info,
    menuCatalog,
    packageCatalog,
    search,
} from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage, SharedData } from '@/types';

type Props = {
    children: ReactNode;
    backHref?: string;
    backLabel?: string;
};

type NavigationDestination = {
    title: string;
    href: string;
    icon: React.ElementType;
};

const MAX_SUGGESTIONS = 8;

const navigationDestinations: NavigationDestination[] = [
    { title: 'Beranda', href: home().url, icon: LayoutGrid },
    { title: 'Menu', href: menuCatalog().url, icon: UtensilsCrossed },
    { title: 'Paket', href: packageCatalog().url, icon: Package },
    { title: 'Tentang', href: info().url, icon: Info },
];

export default function CustomerSearchLayout({
    children,
    backHref = '/',
    backLabel = 'Kembali',
}: Props) {
    useCustomerTheme();
    const page = usePage<
        SharedData & {
            business: CustomerBusiness;
            menuItems?: OrderMenuItem[];
            packages?: OrderPackage[];
            query?: string;
        }
    >();
    const { business, menuItems = [], packages = [], query = '' } = page.props;
    const cart = useCustomerCartStore(menuItems, packages);
    const isSearchResult = query.trim().length > 0;
    const [searchValue, setSearchValue] = useState(query);

    const normalizedQuery = searchValue.trim().toLowerCase();
    const suggestions = useMemo(
        () => searchSuggestions(menuItems, packages, normalizedQuery),
        [menuItems, packages, normalizedQuery],
    );

    function handleSearchSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const trimmed = searchValue.trim();

        if (trimmed) {
            router.visit(search.url({ query: { q: trimmed } }), {
                preserveScroll: false,
            });
        }
    }

    function handleSelect(value: string): void {
        router.visit(search.url({ query: { q: value } }), {
            preserveScroll: false,
        });
    }

    function handleNavigate(href: string): void {
        router.visit(href, { preserveScroll: false });
    }

    const showSuggestions = searchValue.length > 0 && suggestions.length > 0;
    const showEmpty = searchValue.length > 0 && suggestions.length === 0;
    const showNavigation = searchValue.length === 0;

    return (
        <AppShell variant="header">
            <header
                className={cn(
                    'sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)] text-foreground',
                )}
            >
                <div className="relative mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    {/* Back button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 rounded-full text-foreground hover:bg-muted"
                        onClick={() => {
                            if (window.history.length > 1) {
                                window.history.back();
                            } else {
                                window.location.href = backHref;
                            }
                        }}
                        aria-label={backLabel}
                    >
                        <ChevronLeft className="size-6" />
                    </Button>

                    {/* Search input */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative flex-1"
                    >
                        <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" />

                        <input
                           
                            autoFocus
                            type="text"
                            enterKeyHint="search"
                            inputMode="search"
                            value={searchValue}
                            onChange={(e) => setSearchValue(e.target.value)}
                            placeholder="Cari menu atau paket..."
                            className="h-10 w-full rounded-full border border-primary/15 bg-primary/[0.03] pr-10 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                        />

                        {searchValue && (
                            <button
                                type="button"
                                onClick={() => setSearchValue('')}
                                aria-label="Bersihkan pencarian"
                                className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </form>

                    {/* Cart: inline header button on desktop, floating (FAT) on mobile – consistent with AppHeader */}
                    {isSearchResult && (
                        <Button
                            size="icon"
                            variant="secondary"
                            className="fixed top-20 right-4 z-50 flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95 lg:relative lg:top-0 lg:right-0 lg:size-9 lg:bg-primary/10 lg:text-primary lg:shadow-sm lg:shadow-primary/5 lg:hover:scale-100 lg:hover:bg-primary/20 lg:hover:shadow-md lg:hover:shadow-primary/10 lg:active:scale-95"
                            onClick={() => cart.setCartOpen(true)}
                            aria-label="Buka keranjang"
                        >
                            <ShoppingCart />
                            {cart.count > 0 && (
                                <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] text-primary-foreground shadow-sm">
                                    {cart.count}
                                </Badge>
                            )}
                        </Button>
                    )}
                </div>
            </header>

            {/* Inline suggestion / navigation list – only while typing, hidden on search results */}
            {!isSearchResult &&
                (showNavigation || showSuggestions || showEmpty) && (
                    <div className="border-b bg-background">
                        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
                            {showNavigation && (
                                <>
                                    <p className="px-1 pt-0.5 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Navigasi
                                    </p>
                                    {navigationDestinations.map(
                                        (destination) => (
                                            <button
                                                key={destination.href}
                                                type="button"
                                                onClick={() =>
                                                    handleNavigate(
                                                        destination.href,
                                                    )
                                                }
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors active:bg-muted"
                                            >
                                                <destination.icon className="size-4 shrink-0 text-primary" />
                                                <span>{destination.title}</span>
                                            </button>
                                        ),
                                    )}
                                </>
                            )}

                            {showSuggestions && (
                                <>
                                    <p className="px-1 pt-0.5 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Saran pencarian
                                    </p>
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() =>
                                                handleSelect(suggestion)
                                            }
                                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors active:bg-muted"
                                        >
                                            <Search className="size-4 shrink-0 text-muted-foreground" />
                                            <span className="min-w-0 truncate">
                                                {suggestion}
                                            </span>
                                        </button>
                                    ))}
                                </>
                            )}

                            {showEmpty && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Menu atau paket tidak ditemukan.
                                </p>
                            )}
                        </div>
                    </div>
                )}

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

function searchSuggestions(
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
    normalizedQuery: string,
): string[] {
    if (!normalizedQuery) {
        return [];
    }

    const scored = new Map<string, number>();

    function scoreName(name: string): void {
        const normalizedName = name.toLocaleLowerCase('id-ID');

        if (!normalizedName.includes(normalizedQuery)) {
            return;
        }

        let score = 0;

        if (normalizedName === normalizedQuery) {
            score += 100;
        } else if (normalizedName.startsWith(normalizedQuery)) {
            score += 60;
        } else if (normalizedName.includes(` ${normalizedQuery}`)) {
            score += 40;
        } else {
            score += 20;
        }

        score += Math.max(0, 20 - name.length);

        const existing = scored.get(name) ?? 0;
        scored.set(name, Math.max(existing, score));
    }

    menuItems.forEach((item) => scoreName(item.name));
    packages.forEach((item) => scoreName(item.name));

    return Array.from(scored.entries())
        .sort((first, second) => {
            const scoreDiff = second[1] - first[1];

            if (scoreDiff !== 0) {
                return scoreDiff;
            }
            
            return first[0].localeCompare(second[0], 'id');
        })
        .slice(0, MAX_SUGGESTIONS)
        .map(([name]) => name);
}
