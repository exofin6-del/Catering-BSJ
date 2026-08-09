import { CheckCircle2, SearchIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { PackageMenuItem } from '@/types';

import { formatPackagePrice } from '../../../../utils/package-price';
import { MenuItemThumbnail } from './menu-item-summary';

type CategoryFilterValue = 'all' | `category:${number}` | 'uncategorized';

type CategoryFilterOption = {
    count: number;
    label: string;
    value: CategoryFilterValue;
};

export function MenuItemCommandDialog({
    children,
    description,
    emptyText,
    hideTrigger = false,
    items,
    open,
    onOpenChange,
    searchPlaceholder,
    selectedItemIds = [],
    title,
    triggerClassName,
    triggerSize = 'sm',
    triggerVariant = 'default',
    onSelect,
}: {
    children?: ReactNode;
    description: string;
    emptyText: string;
    hideTrigger?: boolean;
    items: PackageMenuItem[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    searchPlaceholder: string;
    selectedItemIds?: number[];
    title: string;
    triggerClassName?: string;
    triggerSize?: 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-xs';
    triggerVariant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link';
    onSelect: (menuItem: PackageMenuItem) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [categoryFilter, setCategoryFilter] =
        useState<CategoryFilterValue>('all');
    const isControlled = open !== undefined;
    const dialogOpen = open ?? internalOpen;
    const categoryOptions = useMemo(() => menuCategoryOptions(items), [items]);
    const hasAvailableItems = items.some(
        (item) => !selectedItemIds.includes(item.id),
    );
    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const sortedItems = [...items].sort(compareMenuItems);
        const categorizedItems = sortedItems.filter((menuItem) =>
            matchesCategoryFilter(menuItem, categoryFilter),
        );

        if (normalizedQuery === '') {
            return categorizedItems;
        }

        return categorizedItems.filter((menuItem) =>
            [
                menuItem.name,
                menuItem.menu_category?.name,
                menuItem.slug,
                String(menuItem.base_price ?? ''),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery),
        );
    }, [categoryFilter, items, query]);

    function handleOpenChange(nextOpen: boolean): void {
        if (!isControlled) {
            setInternalOpen(nextOpen);
        }

        onOpenChange?.(nextOpen);

        if (!nextOpen) {
            setQuery('');
            setCategoryFilter('all');
        }
    }

    function handleSelect(menuItem: PackageMenuItem): void {
        if (selectedItemIds.includes(menuItem.id)) {
            return;
        }

        onSelect(menuItem);
        handleOpenChange(false);
    }

    return (
        <>
            {!hideTrigger ? (
                <Button
                    type="button"
                    variant={triggerVariant}
                    size={triggerSize}
                    disabled={items.length === 0 || !hasAvailableItems}
                    className={triggerClassName}
                    onClick={() => handleOpenChange(true)}
                >
                    {children}
                </Button>
            ) : null}

            <CommandDialog
                open={dialogOpen}
                onOpenChange={handleOpenChange}
                title={title}
                description={description}
                className="max-sm:top-0 max-sm:h-[100dvh] max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-none sm:top-1/2 sm:max-w-xl sm:-translate-y-1/2"
            >
                <Command
                    shouldFilter={false}
                    className="rounded-none border-none p-0 shadow-2xl sm:rounded-xl"
                >
                    <CommandInput
                        value={query}
                        placeholder={searchPlaceholder}
                        className="h-10 text-[15px]"
                        onValueChange={setQuery}
                    />

                    <CommandList className="max-h-[calc(100dvh-72px)] py-0 sm:max-h-[min(450px,70vh)]">
                        <MenuCategoryChips
                            options={categoryOptions}
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        />

                        {filteredItems.length === 0 ? (
                            <CommandEmpty className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                                    <SearchIcon className="size-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    {emptyText}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Coba gunakan kata kunci lain.
                                </p>
                            </CommandEmpty>
                        ) : (
                            <CommandGroup
                                heading="Daftar Menu"
                                className="px-0 py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-2"
                            >
                                {filteredItems.map((menuItem) => {
                                    const isSelected = selectedItemIds.includes(
                                        menuItem.id,
                                    );

                                    return (
                                        <CommandItem
                                            key={menuItem.id}
                                            value={[
                                                `menu-${menuItem.id}`,
                                                menuItem.name,
                                                menuItem.menu_category?.name,
                                                menuItem.slug,
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                            aria-disabled={isSelected}
                                            disabled={isSelected}
                                            className="group relative flex min-h-[76px] cursor-pointer items-center rounded-none border-b bg-transparent px-4 py-3 transition-colors last:border-b-0 data-selected:bg-muted/50 [&>svg:last-child]:hidden"
                                            onSelect={() =>
                                                handleSelect(menuItem)
                                            }
                                        >
                                            <MenuPickerItemContent
                                                item={menuItem}
                                                isSelected={isSelected}
                                            />
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    );
}

function MenuPickerItemContent({
    isSelected,
    item,
}: {
    isSelected: boolean;
    item: PackageMenuItem;
}) {
    return (
        <div className="grid min-w-0 flex-1 grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex items-center justify-center">
                {isSelected ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                    <span
                        aria-hidden="true"
                        className="size-5 rounded-full border border-input"
                    />
                )}
            </div>
            <MenuItemThumbnail item={item} />
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                    {item.name}
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate uppercase">
                        {item.menu_category?.name ?? 'Tanpa kategori'}
                    </span>
                    <Badge variant="secondary" className="rounded-full">
                        Min. {item.min_order ?? 1} pesanan
                    </Badge>
                </div>
            </div>
            <span className="shrink-0 text-sm font-semibold">
                {formatPackagePrice(item.base_price)}
            </span>
        </div>
    );
}

function MenuCategoryChips({
    options,
    value,
    onValueChange,
}: {
    options: CategoryFilterOption[];
    value: CategoryFilterValue;
    onValueChange: (value: CategoryFilterValue) => void;
}) {
    if (options.length <= 1) {
        return null;
    }

    return (
        <div className="border-b py-3">
            <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {options.map((option) => {
                    const isActive = option.value === value;

                    return (
                        <Button
                            key={option.value}
                            type="button"
                            variant={isActive ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                'h-8 shrink-0 rounded-full px-3',
                                isActive && 'border-primary',
                            )}
                            onClick={() => onValueChange(option.value)}
                        >
                            {option.label}
                            <span
                                className={cn(
                                    'rounded-full px-1.5 text-xs',
                                    isActive
                                        ? 'bg-primary-foreground/15 text-primary-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}
                            >
                                {option.count}
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function compareMenuItems(
    first: PackageMenuItem,
    second: PackageMenuItem,
): number {
    const firstCategory = first.menu_category?.name ?? '';
    const secondCategory = second.menu_category?.name ?? '';
    const categoryComparison = firstCategory.localeCompare(secondCategory);

    if (categoryComparison !== 0) {
        return categoryComparison;
    }

    return first.name.localeCompare(second.name);
}

function menuCategoryOptions(items: PackageMenuItem[]): CategoryFilterOption[] {
    const categories = new Map<number, CategoryFilterOption>();
    let uncategorizedCount = 0;

    items.forEach((menuItem) => {
        const category = menuItem.menu_category;

        if (!category) {
            uncategorizedCount += 1;

            return;
        }

        const current = categories.get(category.id);

        categories.set(category.id, {
            count: (current?.count ?? 0) + 1,
            label: category.name,
            value: `category:${category.id}`,
        });
    });

    const options = [...categories.values()].sort((first, second) =>
        first.label.localeCompare(second.label),
    );

    return [
        {
            count: items.length,
            label: 'Semua',
            value: 'all',
        },
        ...options,
        ...(uncategorizedCount > 0
            ? [
                  {
                      count: uncategorizedCount,
                      label: 'Tanpa kategori',
                      value: 'uncategorized' as const,
                  },
              ]
            : []),
    ];
}

function matchesCategoryFilter(
    menuItem: PackageMenuItem,
    filter: CategoryFilterValue,
): boolean {
    if (filter === 'all') {
        return true;
    }

    if (filter === 'uncategorized') {
        return !menuItem.menu_category;
    }

    return filter === `category:${menuItem.menu_category?.id ?? ''}`;
}
