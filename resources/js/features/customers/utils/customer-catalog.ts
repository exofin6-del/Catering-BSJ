import type { OrderFormItem } from '@/features/orders/types/order-types';
import type {
    OrderMenuItem,
    OrderPackage,
    OrderPackageChoice,
    OrderPackageItem,
} from '@/types';
import type {
    CustomerCatalogItem,
    CustomerCatalogType,
} from '../types/customer-storefront-types';

export const customerCatalogPreviewLimits: Record<
    Exclude<CustomerCatalogType, 'all'>,
    number
> = {
    menu_item: 10,
    package: 8,
};

export type CustomerCatalogPriceSummary = {
    activePrice: number;
    discountPercent: number;
    originalPrice: number | null;
    startsFrom: boolean;
};

export type CustomerCartPackageContent = {
    id: string;
    image: string | null;
    name: string;
    price: number;
};

export function customerCatalogItems(
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): CustomerCatalogItem[] {
    return [
        ...packages.map((item) => ({
            id: `package-${item.id}`,
            item,
            type: 'package' as const,
        })),
        ...menuItems.map((item) => ({
            id: `menu-${item.id}`,
            item,
            type: 'menu_item' as const,
        })),
    ];
}

export function customerCatalogCategories(
    items: CustomerCatalogItem[],
    type: CustomerCatalogType,
): string[] {
    return Array.from(
        new Set(
            items
                .filter((entry) => type === 'all' || entry.type === type)
                .map(customerCatalogItemCategory)
                .filter((category): category is string => Boolean(category)),
        ),
    ).sort((first, second) => first.localeCompare(second, 'id'));
}

export function customerCartPackageContents(
    item: OrderFormItem,
    menuPackage: OrderPackage,
): CustomerCartPackageContent[] {
    return menuPackage.items.map((packageItem) => {
        const selectedMenuItemId = item.selected_items.find(
            (selectedItem) =>
                selectedItem.package_item_id === String(packageItem.id),
        )?.menu_item_id;
        const selectedChoice = packageItem.item_prices.find(
            (choice) => String(choice.menu_item_id) === selectedMenuItemId,
        );
        const resolvedChoice =
            selectedChoice ?? defaultCustomerPackageChoice(packageItem);
        const menuItem =
            packageItem.item_prices.length > 0
                ? resolvedChoice?.menu_item
                : packageItem.menu_item;

        return {
            id: `${packageItem.id}:${menuItem?.id ?? 'unavailable'}`,
            image: menuItem?.primary_image ?? null,
            name: menuItem?.name ?? packageItem.name,
            price:
                packageItem.item_prices.length > 0
                    ? customerPackageContentPrice(
                          resolvedChoice?.package_price ??
                              menuItem?.promo_price ??
                              menuItem?.base_price,
                      )
                    : customerPackageContentPrice(
                          packageItem.package_price ??
                              menuItem?.promo_price ??
                              menuItem?.base_price,
                      ),
        };
    });
}

function customerPackageContentPrice(
    value: number | string | null | undefined,
): number {
    const price = Number(value ?? 0);

    return Number.isFinite(price) ? price : 0;
}

function defaultCustomerPackageChoice(
    packageItem: OrderPackageItem,
): OrderPackageChoice | undefined {
    const configuredChoice = packageItem.item_prices.find(
        (choice) =>
            packageItem.menu_item_id !== null &&
            packageItem.menu_item_id !== undefined &&
            String(choice.menu_item_id) === String(packageItem.menu_item_id),
    );

    return (
        configuredChoice ??
        packageItem.item_prices.find((choice) => choice.is_recommended) ??
        packageItem.item_prices[0]
    );
}

export function filterCustomerCatalog(
    items: CustomerCatalogItem[],
    type: CustomerCatalogType,
    category: string,
    search: string,
): CustomerCatalogItem[] {
    const normalizedSearch = normalizeCustomerCatalogText(search);

    return items.filter((entry) => {
        const itemCategory = customerCatalogItemCategory(entry);
        const searchableText = normalizeCustomerCatalogText(
            [entry.item.name, entry.item.description, itemCategory].join(' '),
        );

        return (
            (type === 'all' || entry.type === type) &&
            (category === 'all' || itemCategory === category) &&
            (normalizedSearch === '' ||
                searchableText.includes(normalizedSearch))
        );
    });
}

export function customerCatalogItemCategory(
    entry: CustomerCatalogItem,
): string | null {
    return entry.type === 'menu_item'
        ? (entry.item.menu_category?.name ?? null)
        : (entry.item.package_category?.name ?? null);
}

export function customerCatalogPriceSummary(
    entry: CustomerCatalogItem,
): CustomerCatalogPriceSummary {
    if (entry.type === 'package') {
        const activePrice = customerCatalogNumberValue(entry.item.price);
        const originalPrice = customerCatalogPackageOriginalPrice(entry.item);
        const discountPercent = customerCatalogDiscountPercentage(
            originalPrice,
            activePrice,
        );

        return {
            activePrice,
            discountPercent,
            originalPrice: discountPercent > 0 ? originalPrice : null,
            startsFrom: entry.item.items.some(
                (packageItem) => packageItem.item_prices.length > 0,
            ),
        };
    }

    const originalPrice = customerCatalogNumberValue(
        entry.item.base_price ?? entry.item.price,
    );
    const promoPrice = customerCatalogNumberValue(entry.item.promo_price);
    const hasPromo =
        entry.item.promo_price !== undefined &&
        entry.item.promo_price !== null &&
        entry.item.promo_price !== '' &&
        promoPrice < originalPrice;
    const discountPercent = hasPromo
        ? customerCatalogDiscountPercentage(originalPrice, promoPrice)
        : 0;

    return {
        activePrice: hasPromo ? promoPrice : originalPrice,
        discountPercent,
        originalPrice: hasPromo ? originalPrice : null,
        startsFrom: false,
    };
}

export type CustomerRecommendationSection = {
    description: string;
    items: CustomerCatalogItem[];
    title: string;
    type: Exclude<CustomerCatalogType, 'all'>;
};

export function customerRecommendationSections(
    items: CustomerCatalogItem[],
    currentType: Exclude<CustomerCatalogType, 'all'>,
    currentId: number,
    limit = 4,
): CustomerRecommendationSection[] {
    const currentEntry = items.find(
        (entry) => entry.type === currentType && entry.item.id === currentId,
    );
    const currentCategory = currentEntry
        ? customerCatalogItemCategory(currentEntry)
        : null;
    const sectionTypes: Exclude<CustomerCatalogType, 'all'>[] =
        currentType === 'package'
            ? ['package', 'menu_item']
            : ['menu_item', 'package'];

    return sectionTypes.map((sectionType) => ({
        ...customerRecommendationSectionCopy(
            sectionType,
            currentType,
            currentCategory,
        ),
        items: items
            .filter(
                (entry) =>
                    entry.type === sectionType &&
                    !(
                        entry.type === currentType &&
                        entry.item.id === currentId
                    ),
            )
            .map((entry, index) => ({
                entry,
                index,
                score: customerRecommendationScore(
                    entry,
                    currentEntry,
                    currentCategory,
                ),
            }))
            .sort(
                (first, second) =>
                    second.score - first.score || first.index - second.index,
            )
            .slice(0, limit)
            .map(({ entry }) => entry),
        type: sectionType,
    }));
}

function customerRecommendationScore(
    entry: CustomerCatalogItem,
    currentEntry: CustomerCatalogItem | undefined,
    currentCategory: string | null,
): number {
    let score = entry.item.is_recommended ? 2 : 0;

    if (
        currentEntry &&
        entry.type === currentEntry.type &&
        currentCategory &&
        customerCatalogItemCategory(entry) === currentCategory
    ) {
        score += 8;
    }

    if (currentEntry && customerCatalogItemsAreRelated(entry, currentEntry)) {
        score += 6;
    }

    return score;
}

function customerCatalogItemsAreRelated(
    entry: CustomerCatalogItem,
    currentEntry: CustomerCatalogItem,
): boolean {
    if (entry.type === currentEntry.type) {
        return false;
    }

    const packageEntry =
        entry.type === 'package'
            ? entry
            : currentEntry.type === 'package'
              ? currentEntry
              : null;
    const menuEntry =
        entry.type === 'menu_item'
            ? entry
            : currentEntry.type === 'menu_item'
              ? currentEntry
              : null;

    if (!packageEntry || !menuEntry) {
        return false;
    }

    return packageEntry.item.items.some(
        (packageItem) =>
            packageItem.menu_item_id === menuEntry.item.id ||
            packageItem.menu_item?.id === menuEntry.item.id ||
            packageItem.item_prices.some(
                (choice) =>
                    choice.menu_item_id === menuEntry.item.id ||
                    choice.menu_item?.id === menuEntry.item.id,
            ),
    );
}

function customerRecommendationSectionCopy(
    sectionType: Exclude<CustomerCatalogType, 'all'>,
    currentType: Exclude<CustomerCatalogType, 'all'>,
    currentCategory: string | null,
): Pick<CustomerRecommendationSection, 'description' | 'title'> {
    if (sectionType === currentType) {
        const categoryDescription = currentCategory
            ? `Pilihan lain dari kategori ${currentCategory}.`
            : 'Pilihan lain dengan karakter yang serupa.';

        return {
            description: categoryDescription,
            title: sectionType === 'package' ? 'Paket serupa' : 'Menu serupa',
        };
    }

    return sectionType === 'package'
        ? {
              description: 'Paket praktis yang cocok dengan menu pilihan Anda.',
              title: 'Paket terkait',
          }
        : {
              description:
                  'Menu pilihan untuk melengkapi kebutuhan pesanan Anda.',
              title: 'Menu pelengkap',
          };
}

export function customerCartItemKey(item: OrderFormItem): string {
    const selectedItems = [...item.selected_items]
        .sort((first, second) =>
            first.package_item_id.localeCompare(second.package_item_id),
        )
        .map(
            (selectedItem) =>
                `${selectedItem.package_item_id}:${selectedItem.menu_item_id}`,
        )
        .join('|');

    return [
        item.item_type,
        item.menu_item_id,
        item.package_id,
        selectedItems,
    ].join(':');
}

function normalizeCustomerCatalogText(value: string): string {
    return value.trim().toLocaleLowerCase('id-ID');
}

function customerCatalogNumberValue(value: unknown): number {
    const amount = Number(value ?? 0);

    return Number.isFinite(amount) ? amount : 0;
}

function customerCatalogDiscountPercentage(
    originalPrice: number,
    activePrice: number,
): number {
    if (originalPrice <= 0 || activePrice >= originalPrice) {
        return 0;
    }

    return Math.round(((originalPrice - activePrice) / originalPrice) * 100);
}

function customerCatalogPackageOriginalPrice(
    packageItem: OrderPackage,
): number {
    return packageItem.items.reduce((total, item) => {
        const choiceOriginalPrices = item.item_prices
            .map((choice) =>
                customerCatalogNumberValue(choice.menu_item?.base_price),
            )
            .filter((price) => price > 0);
        const originalPrice =
            choiceOriginalPrices.length > 0
                ? Math.min(...choiceOriginalPrices)
                : customerCatalogNumberValue(item.menu_item?.base_price);

        return total + originalPrice;
    }, 0);
}
