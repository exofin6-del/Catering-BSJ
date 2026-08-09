import assert from 'node:assert/strict';
import test from 'node:test';

import {
    inferredOrderPaymentType,
    normalizeOrderPaymentAmountInput,
    orderPaymentAmountFormValue,
    orderPaymentAmountMode,
    pendingOrderPaymentKind,
    recommendedOrderPaymentAmount,
} from '../../resources/js/features/orders/utils/order-payment-logic.ts';

test('full payments always recommend the remaining balance', () => {
    assert.equal(
        recommendedOrderPaymentAmount({
            paymentType: 'full',
            previousPaid: 0,
            total: 100_000,
        }),
        100_000,
    );
    assert.equal(
        recommendedOrderPaymentAmount({
            paymentType: 'full',
            previousPaid: 35_000,
            total: 100_000,
        }),
        65_000,
    );
});

test('initial DP uses its configured amount or fifty percent', () => {
    assert.equal(
        recommendedOrderPaymentAmount({
            dpAmount: 40_000,
            paymentType: 'dp',
            previousPaid: 0,
            total: 100_000,
        }),
        40_000,
    );
    assert.equal(
        recommendedOrderPaymentAmount({
            paymentType: 'dp',
            previousPaid: 0,
            total: 100_000,
        }),
        50_000,
    );
});

test('a payment after DP is fixed to the remaining balance', () => {
    assert.equal(
        orderPaymentAmountMode({
            canRecordPayment: true,
            paymentMethod: 'transfer',
            paymentType: 'dp',
            previousPaid: 50_000,
        }),
        'fixed',
    );
    assert.equal(
        recommendedOrderPaymentAmount({
            dpAmount: 50_000,
            paymentType: 'dp',
            previousPaid: 50_000,
            total: 120_000,
        }),
        70_000,
    );
});

test('initial DP stays editable while unavailable payments are disabled', () => {
    assert.equal(
        orderPaymentAmountMode({
            canRecordPayment: true,
            paymentMethod: 'cash',
            paymentType: 'dp',
            previousPaid: 0,
        }),
        'editable',
    );
    assert.equal(
        orderPaymentAmountMode({
            canRecordPayment: true,
            paymentMethod: '',
            paymentType: 'dp',
            previousPaid: 0,
        }),
        'editable',
    );
    assert.equal(
        orderPaymentAmountMode({
            canRecordPayment: false,
            paymentMethod: undefined,
            paymentType: 'full',
            previousPaid: 0,
        }),
        'disabled',
    );
});

test('payment input strips formatting and cannot exceed the balance', () => {
    assert.equal(
        normalizeOrderPaymentAmountInput('Rp 75.000', 100_000),
        '75000',
    );
    assert.equal(
        normalizeOrderPaymentAmountInput('150.000', 100_000),
        '100000',
    );
});

test('payment amount form values omit empty or zero amounts', () => {
    assert.equal(orderPaymentAmountFormValue(0), '');
    assert.equal(orderPaymentAmountFormValue(-10_000), '');
    assert.equal(orderPaymentAmountFormValue(75_000.25), '75000');
});

test('payment type is inferred from the submitted amount', () => {
    assert.equal(
        inferredOrderPaymentType({
            paymentAmount: 50_000,
            previousPaid: 0,
            remainingBeforePayment: 100_000,
        }),
        'dp',
    );
    assert.equal(
        inferredOrderPaymentType({
            paymentAmount: 100_000,
            previousPaid: 0,
            remainingBeforePayment: 100_000,
        }),
        'full',
    );
    assert.equal(
        inferredOrderPaymentType({
            existingPaymentType: 'dp',
            paymentAmount: 50_000,
            previousPaid: 50_000,
            remainingBeforePayment: 50_000,
        }),
        'dp',
    );
});

test('pending payment kind follows the payment state instead of only previous payments', () => {
    assert.equal(
        pendingOrderPaymentKind({
            paymentAmount: 50_000,
            paymentType: 'dp',
            previousPaid: 0,
            total: 100_000,
        }),
        'dp',
    );
    assert.equal(
        pendingOrderPaymentKind({
            paymentAmount: 100_000,
            paymentType: 'dp',
            previousPaid: 0,
            total: 100_000,
        }),
        'full',
    );
    assert.equal(
        pendingOrderPaymentKind({
            paymentAmount: 50_000,
            paymentType: 'dp',
            previousPaid: 50_000,
            total: 100_000,
        }),
        'remaining',
    );
    assert.equal(
        pendingOrderPaymentKind({
            paymentAmount: 40_000,
            paymentType: 'full',
            previousPaid: 0,
            total: 100_000,
        }),
        'partial',
    );
});
