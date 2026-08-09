import assert from 'node:assert/strict';
import test from 'node:test';

import { getScheduleExportItems } from '../../resources/js/features/schedules/utils/schedule-export-cache.ts';
import { buildScheduleExportQuery } from '../../resources/js/features/schedules/utils/schedule-export-query.ts';
import {
    formatScheduleMenuItems,
    formatScheduleGoogleMapsUrl,
    formatScheduleMonthRange,
} from '../../resources/js/features/schedules/utils/schedule-format.ts';

test('schedule export lists menu names and quantities without package names', () => {
    const items = [
        {
            name: 'Nasi Liwet',
            package_name: 'Paket Pernikahan',
            qty: 120,
        },
        {
            name: 'Es Teh',
            package_name: null,
            qty: 80,
        },
    ];

    assert.equal(
        formatScheduleMenuItems(items),
        'Nasi Liwet x 120\nEs Teh x 80',
    );
});

test('schedule export uses a fallback when there are no menu items', () => {
    assert.equal(formatScheduleMenuItems([]), 'Belum ada menu');
});

test('schedule export generates a Google Maps link from saved coordinates', () => {
    assert.equal(
        formatScheduleGoogleMapsUrl('-6.2', '106.816666'),
        'https://www.google.com/maps/search/?api=1&query=-6.2%2C106.816666',
    );
    assert.equal(
        formatScheduleGoogleMapsUrl(null, 106.816666),
        'Lokasi belum tersedia',
    );
});

test('schedule list formats the selected month as a date range', () => {
    assert.equal(formatScheduleMonthRange('2026-07'), '1–31 Juli 2026');
    assert.equal(formatScheduleMonthRange('2024-02'), '1–29 Februari 2024');
});

test('schedule export query requests the complete unpaginated result set', () => {
    assert.deepEqual(buildScheduleExportQuery('all', '', ''), {
        export_period: 'all',
        scope: 'all',
        sort_by: 'event_date',
        sort_dir: 'asc',
    });

    assert.deepEqual(
        buildScheduleExportQuery('custom', '2026-07-31', '2026-08-01'),
        {
            event_date_from: '2026-07-31',
            event_date_to: '2026-08-01',
            scope: 'all',
            sort_by: 'event_date',
            sort_dir: 'asc',
        },
    );
});

test('schedule export cache reuses an in-flight and completed request', async () => {
    let requestCount = 0;
    const loader = async () => {
        requestCount += 1;

        await Promise.resolve();

        return [];
    };

    const key = 'schedule-export-cache-test';
    const [firstResult, secondResult] = await Promise.all([
        getScheduleExportItems(key, loader),
        getScheduleExportItems(key, loader),
    ]);

    assert.deepEqual(firstResult, []);
    assert.deepEqual(secondResult, []);
    assert.equal(requestCount, 1);

    await getScheduleExportItems(key, loader);

    assert.equal(requestCount, 1);
});
