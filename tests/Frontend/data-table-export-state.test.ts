import assert from 'node:assert/strict';
import test from 'node:test';

import {
    dataTableExportSelectionLabel,
    shouldShowDataTableExportFab,
} from '../../resources/js/components/data-table/data-table-export-state.ts';

test('export actions are shown for export mode and active selections', () => {
    assert.equal(
        shouldShowDataTableExportFab({
            isExportSelectionMode: false,
            selectedRowCount: 3,
        }),
        false,
    );

    assert.equal(
        shouldShowDataTableExportFab({
            isExportSelectionMode: true,
            selectedRowCount: 0,
        }),
        true,
    );

    assert.equal(
        shouldShowDataTableExportFab({
            isExportSelectionMode: true,
            selectedRowCount: 2,
        }),
        true,
    );

    assert.equal(
        shouldShowDataTableExportFab({
            isExportSelectionMode: false,
            isSelectionActive: true,
            selectedRowCount: 2,
        }),
        true,
    );

    assert.equal(
        shouldShowDataTableExportFab({
            isExportSelectionMode: false,
            isSelectionActive: true,
            selectedRowCount: 0,
        }),
        false,
    );
});

test('export selection label reports the selected row count', () => {
    assert.equal(dataTableExportSelectionLabel(2), '2 baris dipilih');
});
