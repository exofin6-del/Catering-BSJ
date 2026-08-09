import assert from 'node:assert/strict';
import test from 'node:test';

import {
    clampOrderTime,
    resolveOperationalTimeRange,
} from '../../resources/js/features/orders/utils/order-schedule-logic.ts';

test('operational time range uses configured hours', () => {
    assert.deepEqual(resolveOperationalTimeRange('09:30:00', '20:15:00'), {
        maxTime: '20:15',
        minTime: '09:30',
    });
});

test('operational time range falls back when configuration is invalid', () => {
    assert.deepEqual(resolveOperationalTimeRange('18:00', '08:00'), {
        maxTime: '17:00',
        minTime: '08:00',
    });
    assert.deepEqual(resolveOperationalTimeRange(undefined, undefined), {
        maxTime: '17:00',
        minTime: '08:00',
    });
});

test('order time is constrained to operational hours', () => {
    assert.equal(clampOrderTime('07:30', '08:00', '17:00'), '08:00');
    assert.equal(clampOrderTime('12:45', '08:00', '17:00'), '12:45');
    assert.equal(clampOrderTime('18:30', '08:00', '17:00'), '17:00');
    assert.equal(clampOrderTime('', '08:00', '17:00'), '');
});
