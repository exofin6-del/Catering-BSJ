import {
    Boxes,
    ChevronDown,
    ChevronLeft,
    ChevronUp,
    LayoutGrid,
    PackageOpen,
    Plus,
    Trash2,
    Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import { DataTableFilterChipGroup } from '@/components/data-table';
import {
    OrderItemPickerOptionContent,
    OrderPackageDetailList,
    OrderSummaryList,
    OrderSummaryTotals,
} from '@/components/shared/order-summaries';
import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import {
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import { resolveCategoryIconOption } from '@/features/categories/components/form/constants';
import { OrderConfirmDialog } from '@/features/orders/components/shared/order-confirm-dialog';
import {
    PackageDiscountBadge,
    PackageRecommendedBadge,
} from '@/features/packages/components/shared/package-badges';
import { packageDiscountPercentage } from '@/features/packages/utils/package-price';
import type { OrderMenuItem, OrderPackage } from '@/types';

import type { OrderFormData, OrderFormItem } from '../../../types/order-types';
import {
    hiddenOrderCatalogItemCount,
    latestOrderCatalogItems,
    matchesOrderCatalogQuery,
    OrderCatalogPreviewLimit,
    orderCatalogSearchValue,
    selectedOrderCatalogItemsFirst,
    visibleOrderCatalogItems,
} from '../../../utils/order-catalog-command';
import {
    defaultPackageChoice,
    orderFormItemUnitPrice,
    orderFormSummary,
    packageChoicePrice,
} from '../../../utils/order-form-values';
import {
    formatOrderItemPriceSummary,
    formatOrderPrice,
    numberValue,
} from '../../../utils/order-format';
import { OrderCustomerSummary } from '../order-customer-summary';

export type CatalogSelection =
    | {
          menuItem: OrderMenuItem;
          type: 'menu_item';
      }
    | {
          packageItem: OrderPackage;
          type: 'package';
      };

type CatalogItemFilter = 'all' | 'menu' | 'package';
type CatalogCategory = {
    id: number;
    icon?: string | null;
    name: string;
} | null;
type CatalogCategoryFilter = 'all' | `category:${number}` | 'uncategorized';
type CatalogCategoryFilterOption = {
    id: CatalogCategoryFilter;
    icon: string | null;
    label: string;
};

const CATALOG_ITEM_FILTERS: {
    icon: LucideIcon;
    id: CatalogItemFilter;
    label: string;
}[] = [
    { icon: LayoutGrid, id: 'all', label: 'Semua' },
    { icon: Utensils, id: 'menu', label: 'Menu' },
    { icon: Boxes, id: 'package', label: 'Paket' },
];
const ALL_CATALOG_CATEGORY_FILTER = 'all';

type OrderItemsStepProps = {
    data: OrderFormItem[];
    itemError: string | null;
    itemKeys: string[];
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    onAddItem: (item: OrderFormItem) => void;
    onRemoveItem: (index: number) => void;
};

export function OrderItemsStep({
    data,
    itemError,
    itemKeys,
    menuItems,
    packages,
    onAddItem,
    onRemoveItem,
}: OrderItemsStepProps) {
    const { clearErrors, setValue } = useFormContext<OrderFormData>();
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [catalogSelection, setCatalogSelection] =
        useState<CatalogSelection | null>(null);
    const summary = useMemo(
        () => orderFormSummary(data, menuItems, packages),
        [data, menuItems, packages],
    );
    const summaryItems = data.map((item, index) =>
        orderSummaryItem({
            index,
            item,
            itemKey: itemKeys[index] ?? `order-item-${index}`,
            menuItems,
            packages,
            onQuantityChange: (value) => updateQuantity(index, value),
            onQuantityCommit: (value) => updateQuantity(index, value),
            onQuantityDecrease: () => changeQuantity(index, item, -1),
            onQuantityIncrease: () => changeQuantity(index, item, 1),
            onRemove: () => onRemoveItem(index),
        }),
    );

    function handleAddDialogOpenChange(open: boolean): void {
        setAddDialogOpen(open);

        if (!open) {
            setCatalogSelection(null);
        }
    }

    function handleCatalogSelect(selection: CatalogSelection): void {
        setCatalogSelection(selection);
    }

    function handleAddConfirm(item: OrderFormItem): void {
        onAddItem(item);
        clearErrors('items');
        setAddDialogOpen(false);
        setCatalogSelection(null);
    }

    function updateQuantity(index: number, value: string): void {
        setValue(`items.${index}.qty`, value, {
            shouldDirty: true,
            shouldTouch: true,
        });
    }

    function changeQuantity(
        index: number,
        item: OrderFormItem,
        change: number,
    ): void {
        const minimum = orderItemMinimum(item, menuItems, packages);
        const quantity = numericQuantity(item.qty, minimum);
        const nextQuantity = Math.max(minimum, quantity + change);

        updateQuantity(index, String(nextQuantity));
    }

    return (
        <>
            <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
                <section className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                            <FieldContent>
                                <FieldLegend className="text-md font-semibold text-foreground">
                                    Item order
                                </FieldLegend>
                                <FieldDescription className="text-sm leading-snug">
                                    Tambahkan menu atau paket untuk order ini.
                                </FieldDescription>
                            </FieldContent>

                            <Button
                                type="button"
                                className="shrink-0"
                                onClick={() => setAddDialogOpen(true)}
                            >
                                <Plus className="size-4" />
                                Tambah
                            </Button>
                        </div>

                        <FieldGroup className="gap-3">
                            {itemError ? (
                                <FieldError errors={[{ message: itemError }]} />
                            ) : null}

                            {summaryItems.length > 0 ? (
                                <div className="grid gap-3">
                                    <OrderSummaryList
                                        items={summaryItems}
                                        variant="plain"
                                    />
                                    <OrderSummaryTotals
                                        itemCount={data.length}
                                        subtotal={formatOrderPrice(
                                            summary.subtotal,
                                        )}
                                        total={formatOrderPrice(summary.total)}
                                    />
                                </div>
                            ) : (
                                <OrderItemsEmptyState
                                    onAdd={() => setAddDialogOpen(true)}
                                />
                            )}
                        </FieldGroup>
                    </FieldSet>
                </section>

                <aside className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <FieldContent>
                            <FieldLegend className="text-md font-semibold text-foreground">
                                Ringkasan order
                            </FieldLegend>
                            <FieldDescription className="text-sm leading-snug">
                                Periksa kembali item yang sudah ditambahkan.
                            </FieldDescription>
                        </FieldContent>
                        <OrderCustomerSummary />
                    </FieldSet>
                </aside>
            </div>

            <OrderCatalogDialog
                open={addDialogOpen && !catalogSelection}
                items={data}
                menuItems={menuItems}
                packages={packages}
                onOpenChange={handleAddDialogOpenChange}
                onSelect={handleCatalogSelect}
            />

            {catalogSelection?.type === 'menu_item' ? (
                <OrderConfirmDialog
                    key={catalogSelectionKey(catalogSelection)}
                    menuItem={catalogSelection.menuItem}
                    open
                    type="menu_item"
                    onCancel={() => setCatalogSelection(null)}
                    onConfirm={handleAddConfirm}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCatalogSelection(null);
                        }
                    }}
                />
            ) : null}

            {catalogSelection?.type === 'package' ? (
                <OrderConfirmDialog
                    key={catalogSelectionKey(catalogSelection)}
                    open
                    packageItem={catalogSelection.packageItem}
                    type="package"
                    onCancel={() => setCatalogSelection(null)}
                    onConfirm={handleAddConfirm}
                    onOpenChange={(open) => {
                        if (!open) {
                            setCatalogSelection(null);
                        }
                    }}
                />
            ) : null}
        </>
    );
}

export function OrderCatalogDialog({
    description = 'Cari menu atau paket lalu konfirmasi jumlahnya.',
    items,
    menuItems,
    onOpenChange,
    onSelect,
    open,
    packages,
}: {
    description?: string;
    items: OrderFormItem[];
    menuItems: OrderMenuItem[];
    onOpenChange: (open: boolean) => void;
    onSelect: (selection: CatalogSelection) => void;
    open: boolean;
    packages: OrderPackage[];
}) {
    const searchInputRef = useRef<HTMLInputElement>(null);

    return (
        <CommandDialog
            open={open}
            className="top-1/2 max-h-[calc(100dvh-1rem)] -translate-y-1/2 max-sm:top-0 max-sm:right-0 max-sm:left-auto max-sm:h-[100svh] max-sm:max-h-none max-sm:w-screen max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:overflow-hidden max-sm:rounded-none! sm:max-w-2xl"
            description={description}
            initialFocus={searchInputRef}
            mobileAnimation="sheet-right"
            title="Tambah item order"
            onOpenChange={onOpenChange}
        >
            <OrderCatalogCommand
                items={items}
                menuItems={menuItems}
                packages={packages}
                searchInputRef={searchInputRef}
                onBack={() => onOpenChange(false)}
                onSelect={onSelect}
            />
        </CommandDialog>
    );
}

export function OrderCatalogCommand({
    items,
    menuItems,
    packages,
    searchInputRef,
    onBack,
    onSelect,
}: {
    items: OrderFormItem[];
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    searchInputRef?: RefObject<HTMLInputElement | null>;
    onBack: () => void;
    onSelect: (selection: CatalogSelection) => void;
}) {
    const [query, setQuery] = useState('');
    const [itemFilter, setItemFilter] = useState<CatalogItemFilter>('all');
    const [categoryFilter, setCategoryFilter] = useState<CatalogCategoryFilter>(
        ALL_CATALOG_CATEGORY_FILTER,
    );
    const [menuItemVisibleCount, setMenuItemVisibleCount] = useState(
        OrderCatalogPreviewLimit,
    );
    const [packageVisibleCount, setPackageVisibleCount] = useState(
        OrderCatalogPreviewLimit,
    );
    const sortedMenuItems = useMemo(
        () => latestOrderCatalogItems(menuItems),
        [menuItems],
    );
    const sortedPackages = useMemo(
        () => latestOrderCatalogItems(packages),
        [packages],
    );
    const menuCategoryOptions = useMemo(
        () =>
            catalogCategoryFilterOptions(
                sortedMenuItems,
                (menuItem) => menuItem.menu_category ?? null,
            ),
        [sortedMenuItems],
    );
    const packageCategoryOptions = useMemo(
        () =>
            catalogCategoryFilterOptions(
                sortedPackages,
                (packageItem) => packageItem.package_category ?? null,
            ),
        [sortedPackages],
    );
    const activeCategoryOptions =
        itemFilter === 'menu'
            ? menuCategoryOptions
            : itemFilter === 'package'
              ? packageCategoryOptions
              : [];
    const filteredMenuItems = useMemo(
        () =>
            selectedOrderCatalogItemsFirst(
                sortedMenuItems.filter(
                    (menuItem) =>
                        matchesCatalogCategoryFilter(
                            menuItem.menu_category ?? null,
                            itemFilter === 'menu'
                                ? categoryFilter
                                : ALL_CATALOG_CATEGORY_FILTER,
                        ) &&
                        matchesOrderCatalogQuery(
                            menuItemSearchValue(menuItem),
                            query,
                        ),
                ),
                (menuItem) =>
                    isCatalogItemSelected(
                        items,
                        'menu_item',
                        String(menuItem.id),
                    ),
            ),
        [categoryFilter, itemFilter, items, query, sortedMenuItems],
    );
    const filteredPackages = useMemo(
        () =>
            selectedOrderCatalogItemsFirst(
                sortedPackages.filter(
                    (packageItem) =>
                        matchesCatalogCategoryFilter(
                            packageItem.package_category ?? null,
                            itemFilter === 'package'
                                ? categoryFilter
                                : ALL_CATALOG_CATEGORY_FILTER,
                        ) &&
                        matchesOrderCatalogQuery(
                            packageItemSearchValue(packageItem),
                            query,
                        ),
                ),
                (packageItem) =>
                    isCatalogItemSelected(
                        items,
                        'package',
                        String(packageItem.id),
                    ),
            ),
        [categoryFilter, itemFilter, items, query, sortedPackages],
    );
    const shouldShowMenuItems = itemFilter !== 'package';
    const shouldShowPackages = itemFilter !== 'menu';
    const visibleMenuItems = shouldShowMenuItems
        ? visibleOrderCatalogItems(filteredMenuItems, menuItemVisibleCount)
        : [];
    const visiblePackages = shouldShowPackages
        ? visibleOrderCatalogItems(filteredPackages, packageVisibleCount)
        : [];
    const hasCatalogResults =
        (shouldShowMenuItems && filteredMenuItems.length > 0) ||
        (shouldShowPackages && filteredPackages.length > 0);
    const itemFilterOptions = CATALOG_ITEM_FILTERS.map((filter) => {
        const Icon = filter.icon;

        return {
            icon: <Icon aria-hidden="true" className="size-3.5" />,
            id: `item-${filter.id}`,
            label: filter.label,
            selected: itemFilter === filter.id,
            onSelect: () => handleItemFilterChange(filter.id),
        };
    });
    const categoryFilterOptions = activeCategoryOptions.map((filter) => {
        const Icon =
            filter.id === ALL_CATALOG_CATEGORY_FILTER
                ? LayoutGrid
                : resolveCategoryIconOption(filter.icon).icon;

        return {
            icon: <Icon aria-hidden="true" className="size-3.5" />,
            id: `category-${filter.id}`,
            label: filter.label,
            selected: categoryFilter === filter.id,
            onSelect: () => handleCategoryFilterChange(filter.id),
        };
    });
    const shouldShowCategoryFilter =
        itemFilter !== 'all' && activeCategoryOptions.length > 1;
    const catalogFilterOptions = shouldShowCategoryFilter
        ? [...itemFilterOptions, ...categoryFilterOptions]
        : itemFilterOptions;

    function handleItemFilterChange(filter: CatalogItemFilter): void {
        setItemFilter(filter);
        setCategoryFilter(ALL_CATALOG_CATEGORY_FILTER);
        resetCatalogVisibleCounts();
    }

    function handleCategoryFilterChange(filter: CatalogCategoryFilter): void {
        setCategoryFilter(filter);
        resetCatalogVisibleCounts();
    }

    function handleQueryChange(value: string): void {
        setQuery(value);
        resetCatalogVisibleCounts();
    }

    function resetCatalogVisibleCounts(): void {
        setMenuItemVisibleCount(OrderCatalogPreviewLimit);
        setPackageVisibleCount(OrderCatalogPreviewLimit);
    }

    return (
        <Command
            shouldFilter={false}
            className="min-h-0 rounded-none! p-0 max-sm:h-full"
        >
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
                    ref={searchInputRef}
                    autoFocus
                    enterKeyHint="search"
                    inputMode="search"
                    value={query}
                    placeholder="Cari menu atau paket..."
                    wrapperClassName="min-w-0 flex-1 p-0"
                    inputGroupClassName="h-10!"
                    onValueChange={handleQueryChange}
                />
            </div>

            <div className="min-w-0 shrink-0 border-b border-border/60 bg-muted/5 px-4 py-2">
                <DataTableFilterChipGroup
                    label="Filter item dan kategori"
                    options={catalogFilterOptions}
                    showLabel={false}
                    wrap={false}
                    className="min-w-0"
                    chipsClassName="justify-start"
                />
            </div>

            <CommandList className="min-h-0 p-0 max-sm:max-h-none! max-sm:flex-1 sm:max-h-[min(65dvh,32rem)]">
                {!hasCatalogResults ? (
                    <CommandEmpty>
                        Menu atau paket tidak ditemukan.
                    </CommandEmpty>
                ) : null}

                {visibleMenuItems.length > 0 ? (
                    <CommandGroup
                        heading="Menu terbaru"
                        className="px-0 py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-2"
                    >
                        {visibleMenuItems.map((menuItem) => {
                            const isSelected = isCatalogItemSelected(
                                items,
                                'menu_item',
                                String(menuItem.id),
                            );

                            return (
                                <CommandItem
                                    key={`menu-${menuItem.id}`}
                                    aria-disabled={isSelected}
                                    disabled={isSelected}
                                    className="group relative cursor-pointer rounded-none bg-transparent px-4 py-3.5 after:absolute after:right-4 after:bottom-0 after:left-[5.25rem] after:h-px after:bg-border/60 data-selected:bg-transparent data-selected:text-foreground [&>svg:last-child]:hidden"
                                    value={menuItemSearchValue(menuItem)}
                                    onSelect={() => {
                                        if (isSelected) {
                                            return;
                                        }

                                        onSelect({
                                            menuItem,
                                            type: 'menu_item',
                                        });
                                    }}
                                >
                                    <OrderItemPickerOptionContent
                                        categoryName={
                                            menuItem.menu_category?.name
                                        }
                                        badges={
                                            <CatalogBadges
                                                discountPercent={menuDiscountPercent(
                                                    menuItem,
                                                )}
                                                isRecommended={
                                                    menuItem.is_recommended
                                                }
                                            />
                                        }
                                        image={menuItem.primary_image}
                                        minOrder={menuItem.min_order ?? 1}
                                        name={menuItem.name}
                                        originalPrice={menuOriginalPrice(
                                            menuItem,
                                        )}
                                        price={formatOrderPrice(
                                            menuItem.promo_price ??
                                                menuItem.price ??
                                                menuItem.base_price,
                                        )}
                                        type="menu"
                                    />
                                </CommandItem>
                            );
                        })}
                        <CatalogVisibilityToggle
                            hiddenCount={hiddenOrderCatalogItemCount(
                                filteredMenuItems.length,
                                menuItemVisibleCount,
                            )}
                            onShowLess={() =>
                                setMenuItemVisibleCount(
                                    OrderCatalogPreviewLimit,
                                )
                            }
                            onShowMore={() =>
                                setMenuItemVisibleCount(
                                    (current) =>
                                        current + OrderCatalogPreviewLimit,
                                )
                            }
                            visibleCount={menuItemVisibleCount}
                        />
                    </CommandGroup>
                ) : null}

                {visibleMenuItems.length > 0 && visiblePackages.length > 0 ? (
                    <CommandSeparator />
                ) : null}

                {visiblePackages.length > 0 ? (
                    <CommandGroup
                        heading="Paket terbaru"
                        className="px-0 py-2 **:[[cmdk-group-heading]]:px-4 **:[[cmdk-group-heading]]:py-2"
                    >
                        {visiblePackages.map((packageItem) => {
                            const isSelected = isCatalogItemSelected(
                                items,
                                'package',
                                String(packageItem.id),
                            );
                            const price = orderPackagePriceSummary(packageItem);
                            const discountPercent = packageDiscountPercentage(
                                price.originalPrice,
                                price.activePrice,
                            );

                            return (
                                <CommandItem
                                    key={`package-${packageItem.id}`}
                                    aria-disabled={isSelected}
                                    disabled={isSelected}
                                    className="group relative cursor-pointer rounded-none bg-transparent px-4 py-3.5 after:absolute after:right-4 after:bottom-0 after:left-[5.25rem] after:h-px after:bg-border/60 data-selected:bg-transparent data-selected:text-foreground [&>svg:last-child]:hidden"
                                    value={packageItemSearchValue(packageItem)}
                                    onSelect={() => {
                                        if (isSelected) {
                                            return;
                                        }

                                        onSelect({
                                            packageItem,
                                            type: 'package',
                                        });
                                    }}
                                >
                                    <OrderItemPickerOptionContent
                                        badges={
                                            <CatalogBadges
                                                discountPercent={
                                                    discountPercent
                                                }
                                                isRecommended={
                                                    packageItem.is_recommended
                                                }
                                            />
                                        }
                                        categoryName={
                                            packageItem.package_category?.name
                                        }
                                        image={packageItem.primary_image}
                                        minOrder={packageItem.min_order ?? 1}
                                        name={packageItem.name}
                                        originalPrice={
                                            price.originalPrice >
                                            price.activePrice
                                                ? formatOrderPrice(
                                                      price.originalPrice,
                                                  )
                                                : null
                                        }
                                        price={`${price.startsFrom ? 'Mulai ' : ''}${formatOrderPrice(price.activePrice)}`}
                                        type="package"
                                    />
                                </CommandItem>
                            );
                        })}
                        <CatalogVisibilityToggle
                            hiddenCount={hiddenOrderCatalogItemCount(
                                filteredPackages.length,
                                packageVisibleCount,
                            )}
                            onShowLess={() =>
                                setPackageVisibleCount(OrderCatalogPreviewLimit)
                            }
                            onShowMore={() =>
                                setPackageVisibleCount(
                                    (current) =>
                                        current + OrderCatalogPreviewLimit,
                                )
                            }
                            visibleCount={packageVisibleCount}
                        />
                    </CommandGroup>
                ) : null}
            </CommandList>
        </Command>
    );
}

function CatalogVisibilityToggle({
    hiddenCount,
    onShowLess,
    onShowMore,
    visibleCount,
}: {
    hiddenCount: number;
    onShowLess: () => void;
    onShowMore: () => void;
    visibleCount: number;
}) {
    if (hiddenCount <= 0 && visibleCount <= OrderCatalogPreviewLimit) {
        return null;
    }

    return (
        <div className="flex gap-2 border-b border-border/60 px-4 py-2">
            {visibleCount > OrderCatalogPreviewLimit ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 flex-1 justify-center gap-2 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                    onClick={onShowLess}
                >
                    Tampilkan lebih sedikit
                    <ChevronUp className="size-3.5" />
                </Button>
            ) : null}

            {hiddenCount > 0 ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 flex-1 justify-center gap-2 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                    onClick={onShowMore}
                >
                    Tampilkan lebih banyak
                    <ChevronDown className="size-3.5" />
                </Button>
            ) : null}
        </div>
    );
}

function OrderItemsEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="grid min-h-52 place-items-center rounded-md border border-dashed bg-muted/20 p-6 text-center">
            <div className="grid max-w-sm justify-items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md border bg-background text-muted-foreground">
                    <PackageOpen className="size-5" />
                </span>
                <div>
                    <h3 className="text-sm font-semibold">
                        Belum ada item order
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pilih menu atau paket untuk mulai menyusun order.
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={onAdd}>
                    <Plus className="size-4" />
                    Tambah item
                </Button>
            </div>
        </div>
    );
}

function orderSummaryItem({
    index,
    item,
    itemKey,
    menuItems,
    packages,
    onQuantityChange,
    onQuantityCommit,
    onQuantityDecrease,
    onQuantityIncrease,
    onRemove,
}: {
    index: number;
    item: OrderFormItem;
    itemKey: string;
    menuItems: OrderMenuItem[];
    packages: OrderPackage[];
    onQuantityChange: (value: string) => void;
    onQuantityCommit: (value: string) => void;
    onQuantityDecrease: () => void;
    onQuantityIncrease: () => void;
    onRemove: () => void;
}): OrderSummaryItemData {
    const menuItem =
        item.item_type === 'menu_item'
            ? menuItems.find(
                  (currentItem) => String(currentItem.id) === item.menu_item_id,
              )
            : undefined;
    const packageItem =
        item.item_type === 'package'
            ? packages.find(
                  (currentPackage) =>
                      String(currentPackage.id) === item.package_id,
              )
            : undefined;
    const selectedItem = item.item_type === 'package' ? packageItem : menuItem;
    const unitPrice = orderFormItemUnitPrice(item, menuItems, packages);
    const minimum =
        item.item_type === 'package'
            ? (packageItem?.min_order ?? 1)
            : (menuItem?.min_order ?? 1);
    const quantity = numericQuantity(item.qty, minimum);
    const categoryName =
        item.item_type === 'package'
            ? packageItem?.package_category?.name
            : menuItem?.menu_category?.name;

    return {
        details:
            item.item_type === 'package' && packageItem
                ? {
                      content: (
                          <PackageSelectionDetails
                              item={item}
                              packageItem={packageItem}
                          />
                      ),
                      label: `Tampilkan detail ${packageItem.name}`,
                  }
                : undefined,
        id: itemKey,
        image: selectedItem?.primary_image,
        imageAlt: selectedItem?.name,
        meta: (
            <span className="block truncate">
                {categoryName ||
                    (item.item_type === 'package' ? 'Paket' : 'Menu')}
                {' · '}Min. {minimum} pesanan
            </span>
        ),
        name:
            selectedItem?.name ??
            (item.item_type === 'package'
                ? 'Paket tidak tersedia'
                : 'Menu tidak tersedia'),
        quantityControl: {
            detailAction: (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-destructive hover:text-destructive"
                    onClick={onRemove}
                    aria-label={`Hapus item ${index + 1}`}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            ),
            layout: 'right-stacked',
            min: minimum,
            onDecrease: onQuantityDecrease,
            onIncrease: onQuantityIncrease,
            onValueCommit: onQuantityCommit,
            onValueChange: onQuantityChange,
            subtotal: formatOrderPrice(unitPrice * quantity),
            subtotalDetail: formatOrderItemPriceSummary(unitPrice, quantity),
            value: item.qty,
        },
    };
}

function PackageSelectionDetails({
    item,
    packageItem,
}: {
    item: OrderFormItem;
    packageItem: OrderPackage;
}) {
    return (
        <OrderPackageDetailList
            items={packageItem.items.map((component) => {
                const selectedMenuItemId = item.selected_items.find(
                    (selectedItem) =>
                        selectedItem.package_item_id === String(component.id),
                )?.menu_item_id;
                const selectedChoice = component.item_prices.find(
                    (choice) =>
                        String(choice.menu_item_id) === selectedMenuItemId,
                );
                const resolvedChoice =
                    selectedChoice ?? defaultPackageChoice(component);
                const selectedName =
                    component.item_prices.length > 0
                        ? (resolvedChoice?.menu_item?.name ?? 'Belum dipilih')
                        : (component.menu_item?.name ?? component.name);
                const selectedPrice =
                    component.item_prices.length > 0
                        ? packageChoicePrice(resolvedChoice)
                        : numberValue(
                              component.package_price ??
                                  component.menu_item?.promo_price ??
                                  component.menu_item?.base_price,
                          );

                const thumbnail =
                    component.item_prices.length > 0
                        ? resolvedChoice?.menu_item?.primary_image
                        : component.menu_item?.primary_image;

                return {
                    id: component.id,
                    image: thumbnail,
                    name: selectedName,
                    price:
                        selectedPrice > 0
                            ? formatOrderPrice(selectedPrice)
                            : 'Termasuk',
                };
            })}
        />
    );
}

function catalogSelectionKey(selection: CatalogSelection): string {
    return selection.type === 'menu_item'
        ? `menu-${selection.menuItem.id}`
        : `package-${selection.packageItem.id}`;
}

function menuItemSearchValue(menuItem: OrderMenuItem): string {
    return orderCatalogSearchValue([
        `menu-${menuItem.id}`,
        'menu',
        menuItem.name,
        menuItem.menu_category?.name,
    ]);
}

function packageItemSearchValue(packageItem: OrderPackage): string {
    return orderCatalogSearchValue([
        `package-${packageItem.id}`,
        'paket',
        packageItem.name,
        packageItem.package_category?.name,
    ]);
}

function menuOriginalPrice(menuItem: OrderMenuItem): string | null {
    if (
        menuItem.promo_price === undefined ||
        menuItem.promo_price === null ||
        numberValue(menuItem.promo_price) >= numberValue(menuItem.base_price)
    ) {
        return null;
    }

    return formatOrderPrice(menuItem.base_price);
}

function CatalogBadges({
    discountPercent,
    isRecommended,
}: {
    discountPercent: number;
    isRecommended?: boolean;
}) {
    return (
        <>
            {discountPercent > 0 ? (
                <PackageDiscountBadge discountPercent={discountPercent} />
            ) : null}
            {isRecommended ? <PackageRecommendedBadge /> : null}
        </>
    );
}

function menuDiscountPercent(menuItem: OrderMenuItem): number {
    return packageDiscountPercentage(
        menuItem.base_price,
        menuItem.promo_price ?? menuItem.price ?? menuItem.base_price,
    );
}

function orderPackagePriceSummary(packageItem: OrderPackage): {
    activePrice: number;
    originalPrice: number;
    startsFrom: boolean;
} {
    if (packageItem.items.length === 0) {
        const activePrice = numberValue(packageItem.price);

        return {
            activePrice,
            originalPrice: activePrice,
            startsFrom: false,
        };
    }

    const componentSummaries = packageItem.items.map((item) =>
        item.item_prices.length > 0
            ? lowestOrderPackageChoicePrice(item.item_prices)
            : {
                  activePrice: numberValue(
                      item.package_price ??
                          item.menu_item?.promo_price ??
                          item.menu_item?.base_price,
                  ),
                  originalPrice: numberValue(item.menu_item?.base_price),
                  startsFrom: false,
              },
    );

    return {
        activePrice: componentSummaries.reduce(
            (total, summary) => total + summary.activePrice,
            0,
        ),
        originalPrice: componentSummaries.reduce(
            (total, summary) => total + summary.originalPrice,
            0,
        ),
        startsFrom: componentSummaries.some((summary) => summary.startsFrom),
    };
}

function lowestOrderPackageChoicePrice(
    choices: OrderPackage['items'][number]['item_prices'],
): {
    activePrice: number;
    originalPrice: number;
    startsFrom: boolean;
} {
    const summaries = choices.map((choice) => ({
        activePrice: numberValue(
            choice.package_price ??
                choice.menu_item?.promo_price ??
                choice.menu_item?.base_price,
        ),
        originalPrice: numberValue(choice.menu_item?.base_price),
    }));
    const pricedSummaries = summaries.filter(
        (summary) => summary.activePrice > 0,
    );
    const candidates = pricedSummaries.length > 0 ? pricedSummaries : summaries;
    const lowest = candidates.reduce((current, summary) => {
        if (summary.activePrice < current.activePrice) {
            return summary;
        }

        if (
            summary.activePrice === current.activePrice &&
            summary.originalPrice > current.originalPrice
        ) {
            return summary;
        }

        return current;
    });

    return { ...lowest, startsFrom: true };
}

function numericQuantity(value: string, fallback: number): number {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) && parsedValue > 0
        ? Math.floor(parsedValue)
        : fallback;
}

function orderItemMinimum(
    item: OrderFormItem,
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): number {
    if (item.item_type === 'package') {
        return (
            packages.find(
                (packageItem) => String(packageItem.id) === item.package_id,
            )?.min_order ?? 1
        );
    }

    return (
        menuItems.find((menuItem) => String(menuItem.id) === item.menu_item_id)
            ?.min_order ?? 1
    );
}

function catalogCategoryFilterOptions<T>(
    items: T[],
    getCategory: (item: T) => CatalogCategory,
): CatalogCategoryFilterOption[] {
    const categories = new Map<number, CatalogCategoryFilterOption>();
    let hasUncategorizedItems = false;

    items.forEach((item) => {
        const category = getCategory(item);

        if (!category) {
            hasUncategorizedItems = true;

            return;
        }

        if (!categories.has(category.id)) {
            categories.set(category.id, {
                icon: category.icon ?? null,
                id: `category:${category.id}`,
                label: category.name,
            });
        }
    });

    const categoryOptions = [...categories.values()].sort((first, second) =>
        first.label.localeCompare(second.label),
    );

    return [
        {
            id: ALL_CATALOG_CATEGORY_FILTER,
            icon: null,
            label: 'Semua kategori',
        },
        ...categoryOptions,
        ...(hasUncategorizedItems
            ? [
                  {
                      id: 'uncategorized' as const,
                      icon: null,
                      label: 'Tanpa kategori',
                  },
              ]
            : []),
    ];
}

function matchesCatalogCategoryFilter(
    category: CatalogCategory,
    filter: CatalogCategoryFilter,
): boolean {
    if (filter === ALL_CATALOG_CATEGORY_FILTER) {
        return true;
    }

    if (filter === 'uncategorized') {
        return !category;
    }

    return filter === `category:${category?.id ?? ''}`;
}

function isCatalogItemSelected(
    items: OrderFormItem[],
    type: OrderFormItem['item_type'],
    id: string,
): boolean {
    return items.some((item) =>
        type === 'package'
            ? item.item_type === type && item.package_id === id
            : item.item_type === type && item.menu_item_id === id,
    );
}
