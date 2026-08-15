import { Link } from '@inertiajs/react';
import {
    Info,
    LayoutGrid,
    Package,
    ShoppingCart,
    UtensilsCrossed,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/app-shell/breadcrumbs';
import { CustomerCatalogSearch } from '@/components/shared/app-shell/customer-catalog-search';
import AppLogo from '@/components/shared/brand/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
} from '@/components/ui/navigation-menu';

import { useCurrentUrl } from '@/lib/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { home } from '@/routes';
import { info, menuCatalog, packageCatalog } from '@/routes/customerV2';
import type { BreadcrumbItem, NavLinkItem } from '@/types';
import type { OrderMenuItem, OrderPackage } from '@/types';

type Props = {
    breadcrumbs?: BreadcrumbItem[];
    title?: string;
    cartCount?: number;
    cartAnimationKey?: number;
    menuItems?: OrderMenuItem[];
    onCartOpen?: () => void;
    packages?: OrderPackage[];
};

const mainNavItems: NavLinkItem[] = [
    {
        title: 'Beranda',
        href: home(),
        icon: LayoutGrid,
    },
    {
        title: 'Menu',
        href: menuCatalog(),
        icon: UtensilsCrossed,
    },
    {
        title: 'Paket',
        href: packageCatalog(),
        icon: Package,
    },
    {
        title: 'Tentang',
        href: info(),
        icon: Info,
    },
];

const rightNavItems: NavLinkItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Documentation',
    //     href: 'https://laravel.com/docs/starter-kits#react',
    //     icon: BookOpen,
    // },
];

export function AppHeader({
    breadcrumbs = [],
    cartCount = 0,
    cartAnimationKey = 0,
    menuItems = [],
    onCartOpen,
    packages = [],
}: Props) {
    const { isCurrentUrl, whenCurrentUrl } = useCurrentUrl();

    return (
        <>
            <header
                className={cn(
                    'sticky top-0 z-40 bg-background pt-[env(safe-area-inset-top)] text-foreground transition-all duration-300',
                )}
            >
                <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
                    <div className="flex items-center space-x-2">
                        <AppLogo />
                    </div>

                    {/* Desktop Navigation - absolutely centered */}
                    <div className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
                        <NavigationMenu>
                            <NavigationMenuList className="space-x-6">
                                {mainNavItems.map((item, index) => {
                                    const active = isCurrentUrl(item.href);

                                    return (
                                        <NavigationMenuItem
                                            key={index}
                                            className="relative"
                                        >
                                            <Link
                                                href={item.href}
                                                prefetch
                                                className={cn(
                                                    'inline-flex h-10 items-center px-1 text-sm font-medium transition-colors hover:text-foreground/80 focus:outline-none',
                                                    active
                                                        ? 'text-foreground'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {item.icon && (
                                                    <item.icon className="mr-2 h-4 w-4" />
                                                )}
                                                {item.title}
                                            </Link>
                                            {active && (
                                                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-primary"></div>
                                            )}
                                        </NavigationMenuItem>
                                    );
                                })}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        <CustomerCatalogSearch
                            menuItems={menuItems}
                            packages={packages}
                        />

                        {onCartOpen && (
                            <Button
                                size="icon"
                                variant="secondary"
                                className="relative rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 active:scale-95"
                                onClick={onCartOpen}
                                aria-label="Buka keranjang"
                            >
                                {cartAnimationKey > 0 ? (
                                    <span
                                        key={`cart-ring-${cartAnimationKey}`}
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 rounded-full border border-primary/30 opacity-0 motion-safe:animate-cart-ring"
                                    />
                                ) : null}
                                <ShoppingCart
                                    key={`cart-icon-${cartAnimationKey}`}
                                    className={cn(
                                        'relative transition-transform duration-200',
                                        cartAnimationKey > 0 &&
                                            'motion-safe:animate-cart-icon',
                                    )}
                                />
                                {cartCount > 0 && (
                                    <Badge
                                        key={`${cartCount}-${cartAnimationKey}`}
                                        className={cn(
                                            'absolute -top-1.5 -right-1.5 h-5 min-w-5 justify-center rounded-full border-2 border-background bg-primary px-1 text-[10px] text-primary-foreground shadow-sm',
                                            cartAnimationKey > 0 &&
                                                'motion-safe:animate-cart-badge',
                                        )}
                                    >
                                        {cartCount}
                                    </Badge>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </header>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-start px-4 text-neutral-500 sm:px-6">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className="fixed inset-x-0 bottom-0 z-50 bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_0_var(--border)] lg:hidden">
                <div className="mx-auto flex max-w-lg items-stretch">
                    {mainNavItems.map((item) => (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground',
                                whenCurrentUrl(
                                    item.href,
                                    'font-semibold text-primary',
                                ),
                            )}
                        >
                            {item.icon && <item.icon className="h-5 w-5" />}
                            <span>{item.title}</span>
                        </Link>
                    ))}
                    {rightNavItems.map((item) => (
                        <a
                            key={item.title}
                            href={toUrl(item.href)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {item.icon && <item.icon className="h-5 w-5" />}
                            <span>{item.title}</span>
                        </a>
                    ))}
                </div>
            </nav>
        </>
    );
}
