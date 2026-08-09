import assert from 'node:assert/strict';
import test from 'node:test';

import {
    OrderCatalogPreviewLimit,
    hiddenOrderCatalogItemCount,
    latestOrderCatalogItems,
    matchesOrderCatalogQuery,
    orderCatalogSearchValue,
    selectedOrderCatalogItemsFirst,
    visibleOrderCatalogItems,
} from '../../resources/js/features/orders/utils/order-catalog-command.ts';

test('catalog items are sorted newest first with id fallback', () => {
    const items = [
        { created_at: '2026-01-10T00:00:00.000Z', id: 2 },
        { created_at: '2026-02-10T00:00:00.000Z', id: 3 },
        { id: 9 },
        { created_at: 'invalid-date', id: 5 },
    ];

    assert.deepEqual(
        latestOrderCatalogItems(items).map((item) => item.id),
        [3, 2, 9, 5],
    );
});

test('catalog preview shows five items until expanded', () => {
    const items = Array.from({ length: 7 }, (_, index) => index + 1);

    assert.deepEqual(
        visibleOrderCatalogItems(items, OrderCatalogPreviewLimit),
        [1, 2, 3, 4, 5],
    );
    assert.deepEqual(visibleOrderCatalogItems(items, items.length), items);
    assert.equal(
        hiddenOrderCatalogItemCount(items.length, OrderCatalogPreviewLimit),
        2,
    );
    assert.equal(hiddenOrderCatalogItemCount(5, OrderCatalogPreviewLimit), 0);
});

test('selected catalog items stay above available items', () => {
    const items = [{ id: 5 }, { id: 4 }, { id: 3 }, { id: 2 }];

    assert.deepEqual(
        selectedOrderCatalogItemsFirst(items, (item) =>
            [2, 4].includes(item.id),
        ).map((item) => item.id),
        [4, 2, 5, 3],
    );
});

test('catalog search matches normalized item values', () => {
    const searchValue = orderCatalogSearchValue([
        'menu-8',
        'menu',
        'Nasi Liwet',
        'Makanan Utama',
    ]);

    assert.equal(matchesOrderCatalogQuery(searchValue, 'liwet'), true);
    assert.equal(matchesOrderCatalogQuery(searchValue, 'makanan utama'), true);
    assert.equal(matchesOrderCatalogQuery(searchValue, 'paket'), false);
});
