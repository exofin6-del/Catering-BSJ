import { Link } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ImageIcon,
    LayoutGrid,
    Plus,
    SearchX,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { DataTableFilterChipGroup } from '@/components/data-table';
import type { DataTableFilterChipOption } from '@/components/data-table';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';
import { resolveCategoryIconOption } from '@/features/categories/components/form/constants';
import { MenuRecommendedBadge } from '@/features/menus/components/table/menu-table-parts';
import { formatOrderPrice } from '@/features/orders/utils/order-format';
import { PackageDiscountBadge } from '@/features/packages/components/shared/package-badges';
import { usePersistentState } from '@/lib/hooks/use-persistent-state';
import { cn } from '@/lib/utils';
import { menuCatalog, packageCatalog } from '@/routes/customerV2';
import type {
    CustomerCatalogItem,
    CustomerCatalogType,
} from '../types/customer-storefront-types';
import {
    customerCatalogPriceSummary,
    customerCatalogPreviewLimits,
    filterCustomerCatalog,
} from '../utils/customer-catalog';

type CustomerCatalogCategory = {
    icon: string | null;
    name: string;
};

//untuk tampilan beranda index
export function HomeCatalog({
    items,
    search,
    type = 'all',
    onAdd,
    onViewDetail,
    onCategoryNavigate,
}: {
    items: CustomerCatalogItem[];
    search: string;
    type?: CustomerCatalogType;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
    onCategoryNavigate?: (category: string) => void;
}) {
    const [menuCategory, setMenuCategory] = useState('all');
    const [visibleMenuCount, setVisibleMenuCount] = useState(
        customerCatalogPreviewLimits.menu_item,
    );
    const menuCategories = useMemo(
        () => customerCatalogCategoryOptions(items, 'menu_item'),
        [items],
    );
    const filteredPackages = useMemo(
        () => filterCustomerCatalog(items, 'package', 'all', search),
        [items, search],
    );
    const filteredMenuItems = useMemo(
        () => filterCustomerCatalog(items, 'menu_item', menuCategory, search),
        [items, menuCategory, search],
    );
    const showPackageSection = type === 'all' || type === 'package';
    const showMenuSection = type === 'all' || type === 'menu_item';

    function handleMenuCategoryChange(category: string): void {
        if (onCategoryNavigate && category !== 'all') {
            onCategoryNavigate(category);

            return;
        }

        setMenuCategory(category);
        setVisibleMenuCount(customerCatalogPreviewLimits.menu_item);
    }

    return (
        <section>
            {showPackageSection && (
                <CatalogSectionPaket
                    isFirstSection
                    emptyLabel="Paket tidak ditemukan"
                    items={filteredPackages}
                    title="Paket pilihan"
                    viewAllHref={packageCatalog.url()}
                    onAdd={onAdd}
                    onViewDetail={onViewDetail}
                />
            )}

            {showMenuSection && (
                <CatalogSectionMenu
                    isFirstSection={!showPackageSection}
                    categories={menuCategories}
                    category={menuCategory}
                    emptyLabel="Menu tidak ditemukan"
                    items={filteredMenuItems}
                    previewLimit={customerCatalogPreviewLimits.menu_item}
                    title="Menu pilihan"
                    visibleCount={visibleMenuCount}
                    showVisibilityControls={false}
                    viewAllHref={menuCatalog.url()}
                    onAdd={onAdd}
                    onCategoryChange={handleMenuCategoryChange}
                    onShowLess={() =>
                        setVisibleMenuCount(
                            customerCatalogPreviewLimits.menu_item,
                        )
                    }
                    onShowMore={() =>
                        setVisibleMenuCount(
                            (current) =>
                                current +
                                customerCatalogPreviewLimits.menu_item,
                        )
                    }
                    onViewDetail={onViewDetail}
                />
            )}
        </section>
    );
}

//untuk menu

export function MenuCatalog({
    items,
    search,
    initialCategory,
    onAdd,
    onViewDetail,
}: {
    items: CustomerCatalogItem[];
    search: string;
    initialCategory?: string;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    // Use a plain state initialized to 'all' so the server render and the
    // client hydration render are identical and the menu items never flash
    // away. The URL-provided category is applied once after mount to avoid
    // React hydration mismatches from reading `window.location`.
    const [menuCategory, setMenuCategory] = useState('all');
    const initialCategoryRef = useRef<string | undefined>(initialCategory);

    useEffect(() => {
        const category = initialCategoryRef.current;

        if (category === undefined || category === 'all') {
            return;
        }

        Promise.resolve().then(() => setMenuCategory(category));
        // URL category should take effect once on mount, not on every URL change.
    }, []);
    const menuItems = useMemo(
        () => filterCustomerCatalog(items, 'menu_item', menuCategory, search),
        [items, menuCategory, search],
    );
    const menuCategories = useMemo(
        () => customerCatalogCategoryOptions(items, 'menu_item'),
        [items],
    );
    const newestItems = useMemo(
        () =>
            [...menuItems]
                .sort((first, second) => second.item.id - first.item.id)
                .slice(0, customerCatalogPreviewLimits.menu_item),
        [menuItems],
    );
    const groupedMenuItems = useMemo(() => {
        if (menuCategory !== 'all') {
            return [
                [
                    menuCategory,
                    [...menuItems].sort(
                        (first, second) => second.item.id - first.item.id,
                    ),
                ] as [string, CustomerCatalogItem[]],
            ];
        }

        const groups = new Map<string, CustomerCatalogItem[]>();

        menuItems.forEach((entry) => {
            const categoryName =
                entry.type === 'menu_item'
                    ? (entry.item.menu_category?.name ?? 'Lainnya')
                    : 'Lainnya';
            const group = groups.get(categoryName);

            if (group) {
                group.push(entry);
            } else {
                groups.set(categoryName, [entry]);
            }
        });

        return Array.from(groups.entries())
            .map(
                ([name, items]) =>
                    [
                        name,
                        items.sort(
                            (first, second) => second.item.id - first.item.id,
                        ),
                    ] as [string, CustomerCatalogItem[]],
            )
            .sort(([first], [second]) => first.localeCompare(second, 'id'));
    }, [menuItems, menuCategory]);

    return (
        <section className="scroll-mt-20 pt-5">
            <CatalogFilterChips
                categories={menuCategories}
                value={menuCategory}
                onValueChange={setMenuCategory}
            />

            {menuCategory === 'all' && (
                <CatalogSectionPaket
                    isFirstSection
                    emptyLabel="Menu terbaru tidak ditemukan"
                    items={newestItems}
                    title="Terbaru"
                    onAdd={onAdd}
                    onViewDetail={onViewDetail}
                />
            )}

            {groupedMenuItems.map(([categoryName, categoryItems], index) => (
                <MenuCatalogCategorySection
                    key={categoryName}
                    categoryName={categoryName}
                    items={categoryItems}
                    isFirstSection={menuCategory !== 'all' && index === 0}
                    onAdd={onAdd}
                    onViewDetail={onViewDetail}
                />
            ))}
        </section>
    );
}

function MenuCatalogCategorySection({
    categoryName,
    items,
    isFirstSection = false,
    onAdd,
    onViewDetail,
}: {
    categoryName: string;
    items: CustomerCatalogItem[];
    isFirstSection?: boolean;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    const [visibleCount, setVisibleCount] = useState(
        customerCatalogPreviewLimits.menu_item,
    );

    return (
        <CatalogSectionMenu
            categories={[]}
            category="all"
            emptyLabel={`${categoryName} tidak ditemukan`}
            items={items}
            previewLimit={customerCatalogPreviewLimits.menu_item}
            title={categoryName}
            visibleCount={visibleCount}
            isFirstSection={isFirstSection}
            onAdd={onAdd}
            onCategoryChange={() => {}}
            onShowLess={() =>
                setVisibleCount(customerCatalogPreviewLimits.menu_item)
            }
            onShowMore={() =>
                setVisibleCount(
                    (current) =>
                        current + customerCatalogPreviewLimits.menu_item,
                )
            }
            onViewDetail={onViewDetail}
        />
    );
}

//untuk paket

export function PackageCatalog({
    items,
    search,
    onAdd,
    onViewDetail,
}: {
    items: CustomerCatalogItem[];
    search: string;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    const [packageCategory, setPackageCategory] = usePersistentState(
        'package-catalog-category.v1',
        'all',
    );
    const packageItems = useMemo(
        () => filterCustomerCatalog(items, 'package', packageCategory, search),
        [items, packageCategory, search],
    );
    const packageCategories = useMemo(
        () => customerCatalogCategoryOptions(items, 'package'),
        [items],
    );
    const newestItems = useMemo(
        () =>
            [...packageItems]
                .sort((first, second) => second.item.id - first.item.id)
                .slice(0, customerCatalogPreviewLimits.package),
        [packageItems],
    );
    const groupedPackageItems = useMemo(() => {
        if (packageCategory !== 'all') {
            return [
                [
                    packageCategory,
                    [...packageItems].sort(
                        (first, second) => second.item.id - first.item.id,
                    ),
                ] as [string, CustomerCatalogItem[]],
            ];
        }

        const groups = new Map<string, CustomerCatalogItem[]>();

        packageItems.forEach((entry) => {
            const categoryName =
                entry.type === 'package'
                    ? (entry.item.package_category?.name ?? 'Lainnya')
                    : 'Lainnya';
            const group = groups.get(categoryName);

            if (group) {
                group.push(entry);
            } else {
                groups.set(categoryName, [entry]);
            }
        });

        return Array.from(groups.entries())
            .map(
                ([name, items]) =>
                    [
                        name,
                        items.sort(
                            (first, second) => second.item.id - first.item.id,
                        ),
                    ] as [string, CustomerCatalogItem[]],
            )
            .sort(([first], [second]) => first.localeCompare(second, 'id'));
    }, [packageItems, packageCategory]);

    return (
        <section className="scroll-mt-20 pt-5">
            <CatalogFilterChips
                categories={packageCategories}
                value={packageCategory}
                onValueChange={setPackageCategory}
            />

            {packageCategory === 'all' && (
                <CatalogSectionPaket
                    isFirstSection
                    emptyLabel="Paket terbaru tidak ditemukan"
                    items={newestItems}
                    title="Terbaru"
                    onAdd={onAdd}
                    onViewDetail={onViewDetail}
                />
            )}

            {groupedPackageItems.map(([categoryName, categoryItems], index) => (
                <PackageCatalogCategorySection
                    key={categoryName}
                    categoryName={categoryName}
                    items={categoryItems}
                    isFirstSection={packageCategory !== 'all' && index === 0}
                    onAdd={onAdd}
                    onViewDetail={onViewDetail}
                />
            ))}
        </section>
    );
}

function PackageCatalogCategorySection({
    categoryName,
    items,
    isFirstSection = false,
    onAdd,
    onViewDetail,
}: {
    categoryName: string;
    items: CustomerCatalogItem[];
    isFirstSection?: boolean;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    const [visibleCount, setVisibleCount] = useState(
        customerCatalogPreviewLimits.package,
    );

    return (
        <CatalogSectionMenu
            categories={[]}
            category="all"
            emptyLabel={`${categoryName} tidak ditemukan`}
            items={items}
            previewLimit={customerCatalogPreviewLimits.package}
            title={categoryName}
            visibleCount={visibleCount}
            isFirstSection={isFirstSection}
            onAdd={onAdd}
            onCategoryChange={() => {}}
            onShowLess={() =>
                setVisibleCount(customerCatalogPreviewLimits.package)
            }
            onShowMore={() =>
                setVisibleCount(
                    (current) => current + customerCatalogPreviewLimits.package,
                )
            }
            onViewDetail={onViewDetail}
        />
    );
}

export function CatalogSectionMenu({
    categories,
    category,
    emptyLabel,
    items,
    previewLimit,
    title,
    visibleCount,
    isFirstSection = false,
    showVisibilityControls = true,
    viewAllHref,
    onAdd,
    onCategoryChange,
    onShowLess,
    onShowMore,
    onViewDetail,
}: {
    categories: CustomerCatalogCategory[];
    category: string;
    emptyLabel: string;
    items: CustomerCatalogItem[];
    previewLimit: number;
    title: string;
    visibleCount: number;
    isFirstSection?: boolean;
    showVisibilityControls?: boolean;
    viewAllHref?: string;
    onAdd: (item: CustomerCatalogItem) => void;
    onCategoryChange: (category: string) => void;
    onShowLess: () => void;
    onShowMore: () => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    const visibleItems = items.slice(0, visibleCount);

    return (
        <section className={cn('grid gap-5 pt-8', !isFirstSection && 'pt-12')}>
            {categories.length > 0 && (
                <CatalogFilterChips
                    categories={categories}
                    value={category}
                    onValueChange={onCategoryChange}
                />
            )}
            <div className="flex items-end justify-between gap-2">
                <div className="grid max-w-2xl gap-1">
                    <h3 className="text-xl font-semibold tracking-tight">
                        {title}
                    </h3>
                </div>

                {viewAllHref ? (
                    <Link
                        href={viewAllHref}
                        preserveScroll
                        className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        Lihat semua
                        <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                ) : (
                    <p className="shrink-0 text-xs font-medium text-muted-foreground">
                        {items.length} pilihan
                    </p>
                )}
            </div>

            {items.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-5">
                        {visibleItems.map((item) => (
                            <CustomerProductCard
                                key={item.id}
                                entry={item}
                                onClick={() => onViewDetail?.(item)}
                                onAdd={() => onAdd(item)}
                            />
                        ))}
                    </div>
                    {showVisibilityControls && (
                        <CatalogVisibilityControls
                            previewLimit={previewLimit}
                            totalCount={items.length}
                            visibleCount={visibleCount}
                            onShowLess={onShowLess}
                            onShowMore={onShowMore}
                        />
                    )}
                </>
            ) : (
                <CatalogEmptyState label={emptyLabel} />
            )}
        </section>
    );
}
/**
 * Paket section renders as a horizontal carousel (shadcn Carousel) that
 * scrolls to the right. Cards keep the same layout on mobile and desktop.
 */
function CatalogSectionPaket({
    emptyLabel,
    items,
    title,
    isFirstSection = false,
    viewAllHref,
    onAdd,
    onViewDetail,
}: {
    emptyLabel: string;
    items: CustomerCatalogItem[];
    title: string;
    isFirstSection?: boolean;
    viewAllHref?: string;
    onAdd: (item: CustomerCatalogItem) => void;
    onViewDetail?: (item: CustomerCatalogItem) => void;
}) {
    return (
        <section className={cn('grid gap-5 pt-8', !isFirstSection && 'pt-12')}>
            <div className="flex items-end justify-between gap-2">
                <div className="grid max-w-2xl gap-1">
                    <h3 className="text-xl font-semibold tracking-tight">
                        {title}
                    </h3>
                </div>
                {viewAllHref ? (
                    <Link
                        href={viewAllHref}
                        preserveScroll
                        className="group inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                        Lihat semua
                        <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                ) : (
                    <p className="shrink-0 text-xs font-medium text-muted-foreground">
                        {items.length} pilihan
                    </p>
                )}
            </div>

            {items.length > 0 ? (
                <Carousel className="relative">
                    <CarouselContent className="flex">
                        {items
                            .slice(0, customerCatalogPreviewLimits.package)
                            .map((item) => (
                                <CarouselItem
                                    key={item.id}
                                    className="min-w-0 shrink-0 grow-0 basis-[80%] pl-4 sm:basis-1/3 lg:basis-1/5"
                                >
                                    <CustomerPaketCard
                                        entry={item}
                                        onClick={() => onViewDetail?.(item)}
                                        onAdd={() => onAdd(item)}
                                    />
                                </CarouselItem>
                            ))}
                    </CarouselContent>

                    <CarouselPrevious className="left-3 hidden sm:flex" />
                    <CarouselNext className="right-3 hidden sm:flex" />
                </Carousel>
            ) : (
                <CatalogEmptyState label={emptyLabel} />
            )}
        </section>
    );
}

export function CustomerProductCard({
    entry,
    onClick,
    onAdd,
    layout = 'auto',
}: {
    entry: CustomerCatalogItem;
    onClick: () => void;
    onAdd: () => void;
    layout?: 'auto' | 'horizontal';
}) {
    const { item } = entry;
    const priceInfo = customerCatalogPriceSummary(entry);
    const isHorizontal = layout === 'horizontal';

    function handleAddButton(event: MouseEvent<HTMLButtonElement>): void {
        event.preventDefault();
        event.stopPropagation();
        onAdd();
    }

    return (
        <Card
            role="link"
            tabIndex={0}
            aria-label={`Lihat detail ${item.name}`}
            className="group h-full gap-0 overflow-hidden rounded-2xl p-0 shadow-xs transition-all duration-300 hover:border-primary/30 hover:bg-accent/30 hover:shadow-md hover:shadow-primary/5"
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            }}
        >
            <div
                className={cn(
                    'grid h-full grid-cols-[8rem_minmax(0,1fr)]',
                    !isHorizontal && 'sm:grid-cols-1',
                )}
            >
                <div
                    className={cn(
                        'w-full border-r border-border/60 bg-muted',
                        !isHorizontal && 'sm:border-r-0',
                    )}
                >
                    <div
                        className={cn(
                            'relative h-full w-full',
                            !isHorizontal && 'sm:hidden',
                        )}
                    >
                        <CatalogThumbnailMedia
                            image={item.primary_image ?? null}
                            name={item.name}
                        />
                        <CatalogThumbnailBadges
                            isRecommended={item.is_recommended}
                            minOrder={item.min_order ?? 1}
                            packageCount={
                                entry.type === 'package'
                                    ? entry.item.items.length
                                    : undefined
                            }
                        />
                    </div>

                    {!isHorizontal && (
                        <div className="hidden sm:block">
                            <AspectRatio ratio={4 / 3}>
                                <CatalogThumbnailMedia
                                    image={item.primary_image ?? null}
                                    name={item.name}
                                />
                                <CatalogThumbnailBadges
                                    isRecommended={item.is_recommended}
                                    minOrder={item.min_order ?? 1}
                                    packageCount={
                                        entry.type === 'package'
                                            ? entry.item.items.length
                                            : undefined
                                    }
                                />
                            </AspectRatio>
                        </div>
                    )}
                </div>

                <div className="flex h-full min-w-0 flex-col">
                    <CardContent className="space-y-2 px-3 pt-3 pb-3">
                        <CardTitle className="truncate text-[15px] font-semibold">
                            {item.name}
                        </CardTitle>

                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                {priceInfo.startsFrom ? (
                                    <p className="text-xs text-muted-foreground">
                                        Mulai dari
                                    </p>
                                ) : (
                                    <div className="h-4" />
                                )}

                                <div className="flex items-center gap-2">
                                    <p className="text-base leading-none font-semibold">
                                        {formatOrderPrice(
                                            priceInfo.activePrice,
                                        )}
                                    </p>

                                    {priceInfo.discountPercent > 0 && (
                                        <PackageDiscountBadge
                                            discountPercent={
                                                priceInfo.discountPercent
                                            }
                                        />
                                    )}
                                </div>

                                {priceInfo.originalPrice ? (
                                    <p className="text-xs text-muted-foreground line-through">
                                        {formatOrderPrice(
                                            priceInfo.originalPrice,
                                        )}
                                    </p>
                                ) : (
                                    <div className="h-4" />
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 rounded-full border border-primary bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground"
                                onClick={handleAddButton}
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}

export function CustomerPaketCard({
    entry,
    onClick,
    onAdd,
    layout = 'auto',
}: {
    entry: CustomerCatalogItem;
    onClick: () => void;
    onAdd: () => void;
    layout?: 'auto' | 'horizontal';
}) {
    const { item } = entry;
    const priceInfo = customerCatalogPriceSummary(entry);
    const isHorizontal = layout === 'horizontal';

    function handleAddButton(event: MouseEvent<HTMLButtonElement>): void {
        event.preventDefault();
        event.stopPropagation();
        onAdd();
    }

    return (
        <Card
            role="link"
            tabIndex={0}
            aria-label={`Lihat detail ${item.name}`}
            className="group h-full gap-0 overflow-hidden rounded-2xl p-0 shadow-xs transition-all duration-300 hover:border-primary/30 hover:bg-accent/30 hover:shadow-md hover:shadow-primary/5"
            onClick={onClick}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            }}
        >
            <div
                className={cn(
                    'grid h-full',
                    isHorizontal
                        ? 'grid-cols-[8rem_minmax(0,1fr)]'
                        : 'grid-cols-1',
                )}
            >
                <div
                    className={cn(
                        'w-full border-r border-border/60 bg-muted',
                        !isHorizontal && 'sm:border-r-0',
                    )}
                >
                    {isHorizontal ? (
                        <div className="relative h-full w-full">
                            <CatalogThumbnailMedia
                                image={item.primary_image ?? null}
                                name={item.name}
                            />
                            <CatalogThumbnailBadges
                                isRecommended={item.is_recommended}
                                minOrder={item.min_order ?? 1}
                                packageCount={
                                    entry.type === 'package'
                                        ? entry.item.items.length
                                        : undefined
                                }
                            />
                        </div>
                    ) : (
                        <AspectRatio ratio={4 / 3}>
                            <CatalogThumbnailMedia
                                image={item.primary_image ?? null}
                                name={item.name}
                            />
                            <CatalogThumbnailBadges
                                isRecommended={item.is_recommended}
                                minOrder={item.min_order ?? 1}
                                packageCount={
                                    entry.type === 'package'
                                        ? entry.item.items.length
                                        : undefined
                                }
                            />
                        </AspectRatio>
                    )}
                </div>

                <div className="flex h-full min-w-0 flex-col">
                    <CardContent className="space-y-1 px-3 pt-3 pb-2">
                        <CardTitle className="truncate text-[15px] font-semibold">
                            {item.name}
                        </CardTitle>

                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                {priceInfo.startsFrom ? (
                                    <p className="text-xs text-muted-foreground">
                                        Mulai dari
                                    </p>
                                ) : (
                                    <div className="h-4" />
                                )}

                                <div className="flex items-center gap-2">
                                    <p className="text-base leading-none font-semibold">
                                        {formatOrderPrice(
                                            priceInfo.activePrice,
                                        )}
                                    </p>

                                    {priceInfo.discountPercent > 0 && (
                                        <PackageDiscountBadge
                                            discountPercent={
                                                priceInfo.discountPercent
                                            }
                                        />
                                    )}
                                </div>

                                {priceInfo.originalPrice ? (
                                    <p className="text-xs text-muted-foreground line-through">
                                        {formatOrderPrice(
                                            priceInfo.originalPrice,
                                        )}
                                    </p>
                                ) : (
                                    <div className="h-4" />
                                )}
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 rounded-full border border-primary bg-primary text-primary-foreground hover:bg-primary/85 hover:text-primary-foreground"
                                onClick={handleAddButton}
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
}

export function CatalogFilterChips({
    categories,
    value,
    onValueChange,
}: {
    categories: CustomerCatalogCategory[];
    value: string;
    onValueChange: (category: string) => void;
}) {
    const options: DataTableFilterChipOption[] = [
        {
            id: 'all',
            icon: <LayoutGrid className="size-3.5" />,
            label: 'Semua',
            selected: value === 'all',
            onSelect: () => onValueChange('all'),
        },
        ...categories.map((category) => {
            const Icon = resolveCategoryIconOption(category.icon).icon;

            return {
                id: category.name,
                icon: <Icon className="size-3.5" />,
                label: category.name,
                selected: value === category.name,
                onSelect: () => onValueChange(category.name),
            };
        }),
    ];

    return (
        <div aria-label="Filter kategori katalog" className="min-w-0">
            <DataTableFilterChipGroup
                label="Filter kategori katalog"
                options={options}
                showLabel={false}
                wrap={false}
                className="w-full min-w-0"
                chipsClassName="w-full"
            />
        </div>
    );
}

function CatalogVisibilityControls({
    previewLimit,
    totalCount,
    visibleCount,
    onShowLess,
    onShowMore,
}: {
    previewLimit: number;
    totalCount: number;
    visibleCount: number;
    onShowLess: () => void;
    onShowMore: () => void;
}) {
    const remainingCount = Math.max(totalCount - visibleCount, 0);

    if (totalCount <= previewLimit) {
        return null;
    }

    return (
        <div className="grid gap-2 pt-1">
            {remainingCount > 0 && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group h-9 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        onClick={onShowMore}
                    >
                        Next
                        <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Button>
                </div>
            )}
            {visibleCount > previewLimit && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="group h-8 rounded-full px-3 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        onClick={onShowLess}
                    >
                        <ChevronLeft className="size-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                        Previous
                    </Button>
                </div>
            )}
        </div>
    );
}

function customerCatalogCategoryOptions(
    items: CustomerCatalogItem[],
    type: CustomerCatalogItem['type'],
): CustomerCatalogCategory[] {
    const categories = new Map<string, CustomerCatalogCategory>();

    items
        .filter((entry) => entry.type === type)
        .forEach((entry) => {
            const category =
                entry.type === 'menu_item'
                    ? entry.item.menu_category
                    : entry.item.package_category;

            if (category && !categories.has(category.name)) {
                categories.set(category.name, {
                    icon: category.icon ?? null,
                    name: category.name,
                });
            }
        });

    return Array.from(categories.values()).sort((first, second) =>
        first.name.localeCompare(second.name, 'id'),
    );
}

function CatalogEmptyState({ label }: { label: string }) {
    return (
        <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="grid justify-items-center gap-3">
                <SearchX className="size-8 text-muted-foreground" />
                <div>
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">
                        Coba kata kunci atau kategori yang lain.
                    </p>
                </div>
            </div>
        </div>
    );
}

function CatalogThumbnailBadges({
    isRecommended,
    minOrder,
    packageCount,
}: {
    isRecommended?: boolean;
    minOrder: number;
    packageCount?: number;
}) {
    return (
        <>
            {/* Top */}
            <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between">
                {isRecommended ? (
                    <MenuRecommendedBadge className="pointer-events-auto shadow-md backdrop-blur-sm" />
                ) : (
                    <span />
                )}
            </div>

            {/* Bottom */}
            <div className="pointer-events-none absolute inset-x-2 bottom-2 z-10 flex items-center justify-between">
                {packageCount && packageCount > 1 ? (
                    <span className="rounded-full bg-primary/95 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-md backdrop-blur-sm">
                        {packageCount} menu
                    </span>
                ) : (
                    <span />
                )}

                <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md backdrop-blur-sm">
                    Min. {minOrder}
                </span>
            </div>
        </>
    );
}

function CatalogThumbnailMedia({
    image,
    name,
}: {
    image: string | null;
    name: string;
}) {
    if (image) {
        return (
            <img
                src={image}
                alt={name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
        );
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/55">
            <ImageIcon className="size-8" />
        </div>
    );
}
