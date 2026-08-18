import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboardPage = readFileSync(
    new URL(
        '../../resources/js/features/dashboard/pages/dashboard-page.tsx',
        import.meta.url,
    ),
    'utf8',
);

const upcomingOrdersCard = readFileSync(
    new URL(
        '../../resources/js/features/dashboard/components/upcoming-orders-card.tsx',
        import.meta.url,
    ),
    'utf8',
);

test('dashboard uses the same responsive content padding as menu and package pages', () => {
    assert.match(
        dashboardPage,
        /flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6/,
    );
});

test('dashboard upcoming schedules reuse the schedule list item without an order index', () => {
    assert.match(upcomingOrdersCard, /ScheduleListItem/);
    assert.doesNotMatch(upcomingOrdersCard, /index \+ 1/);
});
