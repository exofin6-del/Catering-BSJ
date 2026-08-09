import assert from 'node:assert/strict';
import test from 'node:test';

import {
    changeDataTableSelectAll,
    changeDataTableRowSelection,
    getDataTableSelectAllNextValue,
    getDataTableSelectAllState,
    getPageRowSelection,
} from '../../resources/js/components/data-table/data-table-selection.ts';

test('page row selection includes selectable rows except the omitted row', () => {
    const table = createTable(['1', '2', '3'], ['2']);

    assert.deepEqual(getPageRowSelection(table, '3'), {
        '1': true,
    });
});

test('select all state is indeterminate when some page rows are selected', () => {
    const table = createTable(['1', '2', '3'], ['3']);

    assert.deepEqual(
        getDataTableSelectAllState({
            isAllRowsSelected: false,
            rows: table.getRowModel().rows,
            selectedRowIds: new Set(['1']),
        }),
        {
            checked: 'indeterminate',
            selectablePageRowCount: 2,
            selectedPageRowCount: 1,
        },
    );
});

test('select all state is checked when every selectable page row is selected', () => {
    const table = createTable(['1', '2', '3'], ['3']);

    assert.deepEqual(
        getDataTableSelectAllState({
            isAllRowsSelected: false,
            rows: table.getRowModel().rows,
            selectedRowIds: new Set(['1', '2']),
        }),
        {
            checked: true,
            selectablePageRowCount: 2,
            selectedPageRowCount: 2,
        },
    );
});

test('select all text action selects from unchecked and indeterminate states', () => {
    assert.equal(getDataTableSelectAllNextValue(false), true);
    assert.equal(getDataTableSelectAllNextValue('indeterminate'), true);
    assert.equal(getDataTableSelectAllNextValue(true), false);
});

test('unchecking one row from all rows selected keeps the rest of the page selected', () => {
    let allRowsSelected = true;
    let nextSelection = {};
    let toggledValue: boolean | null = null;
    const table = createTable(['1', '2', '3']);
    const row = createRow('2');

    table.options.meta = {
        setIsAllRowsSelected: (value: boolean) => {
            allRowsSelected = value;
        },
    };
    table.setRowSelection = (selection: Record<string, boolean>) => {
        nextSelection = selection;
    };
    row.toggleSelected = (value: boolean) => {
        toggledValue = value;
    };

    changeDataTableRowSelection({
        isAllRowsSelected: true,
        row,
        table,
        value: false,
    });

    assert.equal(allRowsSelected, false);
    assert.deepEqual(nextSelection, {
        '1': true,
        '3': true,
    });
    assert.equal(toggledValue, null);
});

test('row selection toggles the current row when not selecting all rows', () => {
    let toggledValue: boolean | null = null;
    const table = createTable(['1']);
    const row = createRow('1');

    row.toggleSelected = (value: boolean) => {
        toggledValue = value;
    };

    changeDataTableRowSelection({
        isAllRowsSelected: false,
        row,
        table,
        value: true,
    });

    assert.equal(toggledValue, true);
});

test('select all selects selectable page rows and enables all rows state', () => {
    let allRowsSelected = false;
    let nextSelection = {};
    const table = createTable(['1', '2', '3'], ['2']);

    table.options.meta = {
        setIsAllRowsSelected: (value: boolean) => {
            allRowsSelected = value;
        },
    };
    table.setRowSelection = (selection: Record<string, boolean>) => {
        nextSelection = selection;
    };

    changeDataTableSelectAll({
        table,
        value: true,
    });

    assert.equal(allRowsSelected, true);
    assert.deepEqual(nextSelection, {
        '1': true,
        '3': true,
    });
});

test('clearing select all delegates to the table clear selection callback', () => {
    let cleared = false;
    const table = createTable(['1', '2', '3']);

    table.options.meta = {
        clearSelection: () => {
            cleared = true;
        },
    };

    changeDataTableSelectAll({
        table,
        value: false,
    });

    assert.equal(cleared, true);
});

function createTable(rowIds: string[], disabledRowIds: string[] = []) {
    return {
        getRowModel: () => ({
            rows: rowIds.map((id) =>
                createRow(id, !disabledRowIds.includes(id)),
            ),
        }),
        options: {
            meta: {},
        },
        setRowSelection: () => {},
    } as never;
}

function createRow(id: string, canSelect = true) {
    return {
        id,
        getCanSelect: () => canSelect,
        getIsSelected: () => false,
        toggleSelected: () => {},
    } as never;
}
