export type OrderCatalogSortableItem = {
    created_at?: string | null;
    id: number;
    updated_at?: string | null;
};

export const OrderCatalogPreviewLimit = 5;

export function latestOrderCatalogItems<T extends OrderCatalogSortableItem>(
    items: T[],
): T[] {
    return [...items].sort(compareLatestCatalogItems);
}

export function visibleOrderCatalogItems<T>(
    items: T[],
    visibleCount: number,
): T[] {
    return items.slice(0, visibleCount);
}

export function selectedOrderCatalogItemsFirst<T>(
    items: T[],
    isSelected: (item: T) => boolean,
): T[] {
    const selectedItems: T[] = [];
    const availableItems: T[] = [];

    items.forEach((item) => {
        if (isSelected(item)) {
            selectedItems.push(item);

            return;
        }

        availableItems.push(item);
    });

    return [...selectedItems, ...availableItems];
}

export function hiddenOrderCatalogItemCount(
    total: number,
    visibleCount: number,
): number {
    return Math.max(0, total - visibleCount);
}

export function orderCatalogSearchValue(
    values: Array<number | string | null | undefined>,
): string {
    return values
        .filter(
            (value) => value !== null && value !== undefined && value !== '',
        )
        .join(' ')
        .toLowerCase();
}

export function matchesOrderCatalogQuery(
    searchValue: string,
    query: string,
): boolean {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery === '' || searchValue.includes(normalizedQuery);
}

function compareLatestCatalogItems(
    first: OrderCatalogSortableItem,
    second: OrderCatalogSortableItem,
): number {
    const timestampComparison =
        catalogItemTimestamp(second) - catalogItemTimestamp(first);

    if (timestampComparison !== 0) {
        return timestampComparison;
    }

    return second.id - first.id;
}

function catalogItemTimestamp(item: OrderCatalogSortableItem): number {
    const value = item.created_at ?? item.updated_at;

    if (!value) {
        return 0;
    }

    const timestamp = Date.parse(value);

    return Number.isNaN(timestamp) ? 0 : timestamp;
}
