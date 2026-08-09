import { router } from '@inertiajs/react';
import { ChevronLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';

import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { search } from '@/routes/customerV2';
import type { OrderMenuItem, OrderPackage } from '@/types';

type CustomerCatalogSearchProps = {
    className?: string;
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
};

const MAX_SUGGESTIONS = 8;

export function CustomerCatalogSearch({
    className,
    menuItems,
    packages,
}: CustomerCatalogSearchProps) {
    const [query, setQuery] = useState('');
    const [desktopOpen, setDesktopOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const desktopRef = useRef<HTMLDivElement>(null);
    const normalizedQuery = query.trim().toLowerCase();
    const suggestions = useMemo(
        () => customerSearchSuggestions(menuItems, packages, normalizedQuery),
        [menuItems, normalizedQuery, packages],
    );

    // Close desktop dropdown when clicking outside the search container.
    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (
                desktopRef.current &&
                !desktopRef.current.contains(event.target as Node)
            ) {
                setDesktopOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    function navigateToSearch(value: string): void {
        setDesktopOpen(false);
        setMobileOpen(false);
        setQuery('');

        router.visit(search.url({ query: { q: value } }), {
            preserveScroll: false,
        });
    }

    function handleSubmit(value: string): void {
        const trimmed = value.trim();

        if (trimmed) {
            navigateToSearch(trimmed);
        }
    }

    const searchCommand = (
        <CustomerCatalogSearchCommand
            hasQuery={normalizedQuery.length > 0}
            inputRef={searchInputRef}
            onBack={() => setMobileOpen(false)}
            onQueryChange={setQuery}
            onSelect={navigateToSearch}
            onSubmit={handleSubmit}
            query={query}
            suggestions={suggestions}
        />
    );

    return (
        <>
            {/* Desktop: inline input that reveals a command panel below */}
            <div className={cn('hidden lg:block', className)}>
                <div
                    ref={desktopRef}
                    className="relative ml-auto w-full max-w-xs"
                >
                    <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" />
                    <Input
                        value={query}
                        placeholder="Cari menu atau paket..."
                        className="rounded-full border-primary/15 bg-primary/[0.03] pl-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/30 focus-visible:ring-primary/20"
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setDesktopOpen(
                                event.target.value.trim().length > 0,
                            );
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                handleSubmit(query);
                            }
                        }}
                    />

                    {desktopOpen ? (
                        <div className="absolute top-full left-1/2 z-50 mt-2 w-full -translate-x-1/2 rounded-xl border bg-popover p-0 shadow-lg">
                            <Command
                                shouldFilter={false}
                                className="rounded-xl! border-0 p-0"
                            >
                                <CommandList className="max-h-72 overflow-y-auto p-0">
                                    {suggestions.length === 0 ? (
                                        <CommandEmpty>
                                            Menu atau paket tidak ditemukan.
                                        </CommandEmpty>
                                    ) : (
                                        <CommandGroup
                                            heading="Saran pencarian"
                                            className="px-0 py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-1.5"
                                        >
                                            {suggestions.map((suggestion) => (
                                                <CommandItem
                                                    key={suggestion}
                                                    className="cursor-pointer rounded-none bg-transparent px-4 py-2 text-sm text-foreground data-selected:bg-transparent data-selected:text-primary"
                                                    onSelect={() =>
                                                        navigateToSearch(
                                                            suggestion,
                                                        )
                                                    }
                                                >
                                                    <span className="min-w-0 truncate">
                                                        {suggestion}
                                                    </span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}
                                </CommandList>
                            </Command>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Mobile: icon button opens a full-page right sheet with back */}
            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-primary/10 text-primary shadow-sm shadow-primary/5 transition-all duration-200 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/10 active:scale-95 lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Cari menu atau paket"
            >
                <Search />
            </Button>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent
                    side="right"
                    className="flex w-screen max-w-none flex-col gap-0 border-0 p-0"
                    hideCloseButton
                >
                    <Command
                        shouldFilter={false}
                        className="h-full w-full rounded-none! border-0 p-0"
                    >
                        {searchCommand}
                    </Command>
                </SheetContent>
            </Sheet>
        </>
    );
}

const searchInputRef: RefObject<HTMLInputElement | null> = { current: null };

type CustomerCatalogSearchCommandProps = {
    hasQuery: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onBack: () => void;
    onQueryChange: (value: string) => void;
    onSelect: (value: string) => void;
    onSubmit: (value: string) => void;
    query: string;
    suggestions: string[];
};

function CustomerCatalogSearchCommand({
    hasQuery,
    inputRef,
    onBack,
    onQueryChange,
    onSelect,
    onSubmit,
    query,
    suggestions,
}: CustomerCatalogSearchCommandProps) {
    return (
        <>
            <div className="flex h-16 shrink-0 items-center gap-3 border-b px-4 sm:h-auto sm:p-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="size-9 shrink-0 rounded-full bg-primary/10 text-primary transition-all duration-200 hover:bg-primary/20 sm:hidden"
                    aria-label="Kembali"
                    onClick={onBack}
                >
                    <ChevronLeft className="size-7" />
                </Button>

                <CommandInput
                    ref={inputRef}
                    autoFocus
                    enterKeyHint="search"
                    inputMode="search"
                    value={query}
                    placeholder="Cari menu atau paket..."
                    wrapperClassName="min-w-0 flex-1 p-0"
                    inputGroupClassName="h-10! rounded-full! border-primary/15 bg-primary/[0.03] text-foreground shadow-none! placeholder:text-muted-foreground/50 focus-within:border-primary/30 focus-within:ring-primary/20 **:[data-slot=input-group-addon]:pl-4! **:[data-slot=input-group-addon]:pr-2! **:[data-slot=input-group-addon]:text-primary [&_svg]:opacity-100"
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            onSubmit(query);
                        }
                    }}
                    onValueChange={onQueryChange}
                />
            </div>

            <CommandList className="min-h-0 flex-1 overflow-y-auto p-0 max-sm:max-h-none">
                {!hasQuery ? (
                    <CommandEmpty className="px-4 py-8 text-sm text-muted-foreground">
                        Ketik untuk mencari menu atau paket.
                    </CommandEmpty>
                ) : suggestions.length === 0 ? (
                    <CommandEmpty>
                        Menu atau paket tidak ditemukan.
                    </CommandEmpty>
                ) : (
                    <CommandGroup
                        heading="Saran pencarian"
                        className="px-0 py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-1.5"
                    >
                        {suggestions.map((suggestion) => (
                            <CommandItem
                                key={suggestion}
                                className="cursor-pointer rounded-none bg-transparent px-4 py-2 text-sm text-foreground data-selected:bg-transparent data-selected:text-primary"
                                onSelect={() => onSelect(suggestion)}
                            >
                                <span className="min-w-0 truncate">
                                    {suggestion}
                                </span>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}
            </CommandList>
        </>
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

        // Exact match ranks highest.
        if (normalizedName === normalizedQuery) {
            score += 100;
        } else if (normalizedName.startsWith(normalizedQuery)) {
            // Name starts with the query.
            score += 60;
        } else if (normalizedName.includes(` ${normalizedQuery}`)) {
            // Query starts a word within the name.
            score += 40;
        } else {
            // Query appears somewhere in the middle.
            score += 20;
        }

        // Shorter names are more relevant.
        score += Math.max(0, 20 - name.length);

        // Prefer menu items over packages for equal scores.
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
