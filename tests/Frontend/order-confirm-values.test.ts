import assert from 'node:assert/strict';
import test from 'node:test';
import type { OrderFormItem } from '../../resources/js/features/orders/types/order-types.ts';
import {
    packageConfirmItem,
    toggleSelectedPackageChoice,
} from '../../resources/js/features/orders/utils/order-confirm-values.ts';
import type { OrderPackage } from '../../resources/js/types/index.ts';

const menuPackage = {
    id: 10,
    min_order: 2,
    items: [
        {
            id: 20,
            item_prices: [
                { id: 1, menu_item_id: 30 },
                { id: 2, menu_item_id: 31 },
            ],
        },
    ],
} as OrderPackage;

const packageItem: OrderFormItem = {
    item_type: 'package',
    menu_item_id: '',
    package_id: '10',
    qty: '2',
    selected_items: [],
};

test('new package confirmation starts without a selected choice', () => {
    assert.deepEqual(packageConfirmItem(menuPackage, null).selected_items, []);
});

test('package choice can be selected, replaced, and unchecked', () => {
    const selected = toggleSelectedPackageChoice(packageItem, '20', '30');
    assert.deepEqual(selected, [{ package_item_id: '20', menu_item_id: '30' }]);

    const replaced = toggleSelectedPackageChoice(
        { ...packageItem, selected_items: selected },
        '20',
        '31',
    );
    assert.deepEqual(replaced, [{ package_item_id: '20', menu_item_id: '31' }]);

    const unchecked = toggleSelectedPackageChoice(
        { ...packageItem, selected_items: replaced },
        '20',
        '31',
    );
    assert.deepEqual(unchecked, []);
});

test('editing only keeps choices that still belong to the package', () => {
    const item = {
        ...packageItem,
        selected_items: [
            { package_item_id: '20', menu_item_id: '30' },
            { package_item_id: '99', menu_item_id: '100' },
        ],
    };

    assert.deepEqual(packageConfirmItem(menuPackage, item).selected_items, [
        { package_item_id: '20', menu_item_id: '30' },
    ]);
});
