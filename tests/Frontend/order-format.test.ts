import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatOrderItemPriceSummary,
    orderPaymentMethodLabel,
    orderPaymentTypeLabel,
    orderReceiptDate,
} from '../../resources/js/features/orders/utils/order-format.ts';

test('formats an item unit-price summary', () => {
    assert.equal(formatOrderItemPriceSummary(25_000, 3), 'Rp\u00a025.000 × 3');
});

test('receipt helpers use the latest payment and readable labels', () => {
    assert.equal(
        orderReceiptDate({
            created_at: '2026-07-01T08:00:00Z',
            updated_at: '2026-07-02T08:00:00Z',
            payments: [
                {
                    amount: 25000,
                    id: 1,
                    method: 'transfer',
                    paid_at: '2026-07-03T08:00:00Z',
                    type: 'dp',
                },
            ],
        }),
        '2026-07-03T08:00:00Z',
    );
    assert.equal(orderPaymentTypeLabel('remaining'), 'Pelunasan');
    assert.equal(orderPaymentMethodLabel('cash'), 'Tunai');
});
