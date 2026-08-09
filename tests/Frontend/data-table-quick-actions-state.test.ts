import assert from 'node:assert/strict';
import test from 'node:test';

import { getDataTableDetailEditQuickActionState } from '../../resources/js/components/data-table/data-table-quick-actions-state.ts';

test('detail and edit quick actions are hidden without handlers or routes', () => {
    assert.deepEqual(getDataTableDetailEditQuickActionState({}), {
        canEdit: false,
        canView: false,
        hasActions: false,
    });
});

test('detail and edit quick actions can be shown from handlers', () => {
    assert.deepEqual(
        getDataTableDetailEditQuickActionState({
            hasEditHandler: true,
            hasViewHandler: true,
        }),
        {
            canEdit: true,
            canView: true,
            hasActions: true,
        },
    );
});

test('detail and edit quick actions can be shown from route definitions', () => {
    const route = { method: 'get', url: '/records/1' };

    assert.deepEqual(
        getDataTableDetailEditQuickActionState({
            editHref: route,
            viewHref: route,
        }),
        {
            canEdit: true,
            canView: true,
            hasActions: true,
        },
    );
});
