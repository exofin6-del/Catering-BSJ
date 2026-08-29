import { router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    Info,
    LayoutGrid,
    Package,
    Search,
    UtensilsCrossed,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { home } from '@/routes';
import { info, menuCatalog, packageCatalog, search } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage } from '@/types';

type CustomerCatalogSearchProps = {
    className?: string;
    menuItems?: OrderMenuItem[];
    onMobileOpenChange?: (open: boolean) => void;
    packages?: OrderPackage[];
};

type NavigationDestination = {
    title: string;
    href: string;
    icon: LucideIcon;
};

const MAX_SUGGESTIONS = 8;

const navigationDestinations: NavigationDestination[] = [
    { title: 'Beranda', href: home().url, icon: LayoutGrid },
    { title: 'Menu', href: menuCatalog().url, icon: UtensilsCrossed },
    { title: 'Paket', href: packageCatalog().url, icon: Package },
    { title: 'Tentang', href: info().url, icon: Info },
];

export function CustomerCatalogSearch({
    className,
    menuItems,
    onMobileOpenChange,
    packages,
}: CustomerCatalogSearchProps) {
    const page = usePage<any>();
    const resolvedMenuItems =
        menuItems && menuItems.length > 0
            ? menuItems
            : page.props.menuItems || [];
    const resolvedPackages =
        packages && packages.length > 0 ? packages : page.props.packages || [];

    const [query, setQuery] = useState('');
    const [desktopFocused, setDesktopFocused] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const desktopInputRef = useRef<HTMLInputElement>(null);

    const normalizedQuery = query.trim().toLowerCase();
    const suggestions = useMemo(
        () =>
            customerSearchSuggestions(
                resolvedMenuItems,
                resolvedPackages,
                normalizedQuery,
            ),
        [resolvedMenuItems, normalizedQuery, resolvedPackages],
    );

    // Close desktop dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setDesktopFocused(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Prevent body scroll when mobile search is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    function closeDesktop(): void {
        setDesktopFocused(false);
        setQuery('');
    }

    function openMobile(): void {
        setMobileOpen(true);
        onMobileOpenChange?.(true);
    }

    function closeMobile(): void {
        setMobileOpen(false);
        onMobileOpenChange?.(false);
    }

    function navigateToSearch(value: string): void {
        closeDesktop();
        closeMobile();
        router.visit(search.url({ query: { q: value } }), {
            preserveScroll: false,
        });
    }

    function navigateTo(href: string): void {
        closeDesktop();
        closeMobile();
        router.visit(href, { preserveScroll: false });
    }

    function handleSubmit(e: React.FormEvent): void {
        e.preventDefault();
        const trimmed = query.trim();

        if (trimmed) {
            navigateToSearch(trimmed);
        }
    }

    function handleClear(): void {
        setQuery('');
        desktopInputRef.current?.focus();
    }

    const showDesktopDropdown =
        desktopFocused &&
        (query.length > 0 || navigationDestinations.length > 0);

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            {/* ================================================================== */}
            {/* Desktop: Inline input + floating dropdown                           */}
            {/* ================================================================== */}
            <form onSubmit={handleSubmit} className="relative hidden lg:block">
                <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" />

                <input
                    ref={desktopInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setDesktopFocused(true)}
                    placeholder="Cari menu atau paket..."
                    className="h-10 w-full rounded-full border border-primary/15 bg-primary/[0.03] pr-10 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                />

                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Bersihkan pencarian"
                        className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </form>

            {showDesktopDropdown && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 hidden max-h-72 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md outline-hidden lg:block">
                    {query.length === 0 ? (
                        <>
                            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                Navigasi
                            </p>
                            {navigationDestinations.map((destination) => (
                                <button
                                    key={destination.href}
                                    type="button"
                                    onClick={() => navigateTo(destination.href)}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                                >
                                    <destination.icon className="size-4 shrink-0 text-primary" />
                                    <span className="min-w-0 truncate">
                                        {destination.title}
                                    </span>
                                </button>
                            ))}
                        </>
                    ) : suggestions.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            Menu atau paket tidak ditemukan.
                        </p>
                    ) : (
                        <>
                            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                                Saran pencarian
                            </p>
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => navigateToSearch(suggestion)}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
                                >
                                    <span className="min-w-0 truncate">
                                        {suggestion}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}

            {/* ================================================================== */}
            {/* Mobile: Icon button → open mobile search overlay                 */}
            {/* ================================================================== */}
            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="size-9 rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 active:scale-95 lg:hidden"
                onClick={openMobile}
                aria-label="Cari menu atau paket"
            >
                <Search className="size-5" />
            </Button>

            {/* Mobile: Full-screen search overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex animate-in flex-col bg-background duration-200 slide-in-from-bottom-5 fade-in lg:hidden">
                    {/* Header */}
                    <div className="relative flex h-14 items-center gap-3 border-b bg-background px-4 pt-[env(safe-area-inset-top)]">
                        {/* Back button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 shrink-0 rounded-full text-foreground hover:bg-muted"
                            onClick={closeMobile}
                            aria-label="Kembali"
                        >
                            <ChevronLeft className="size-6" />
                        </Button>

                        {/* Search input */}
                        <form
                            onSubmit={handleSubmit}
                            className="relative flex-1"
                        >
                            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" />

                            <input
                                autoFocus
                                type="text"
                                enterKeyHint="search"
                                inputMode="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari menu atau paket..."
                                className="h-10 w-full rounded-full border border-primary/15 bg-primary/[0.03] pr-10 pl-10 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
                            />

                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    aria-label="Bersihkan pencarian"
                                    className="absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground dark:hover:bg-neutral-800"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Content list */}
                    <div className="flex-1 overflow-y-auto px-4 py-3">
                        {query.length === 0 ? (
                            <div className="space-y-1">
                                <p className="px-3 pt-1 pb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Navigasi
                                </p>
                                {navigationDestinations.map((destination) => (
                                    <button
                                        key={destination.href}
                                        type="button"
                                        onClick={() =>
                                            navigateTo(destination.href)
                                        }
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors active:bg-muted"
                                    >
                                        <destination.icon className="size-4 shrink-0 text-primary" />
                                        <span>{destination.title}</span>
                                    </button>
                                ))}
                            </div>
                        ) : suggestions.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Menu atau paket tidak ditemukan.
                            </p>
                        ) : (
                            <div className="space-y-1">
                                <p className="px-3 pt-1 pb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Saran pencarian
                                </p>
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() =>
                                            navigateToSearch(suggestion)
                                        }
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-foreground transition-colors active:bg-muted"
                                    >
                                        <Search className="size-4 shrink-0 text-muted-foreground" />
                                        <span className="min-w-0 truncate">
                                            {suggestion}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function customerSearchSuggestions(
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
