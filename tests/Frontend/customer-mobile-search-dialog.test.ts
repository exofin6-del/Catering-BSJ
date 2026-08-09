import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const orderItemsStep = readFileSync(
    new URL(
        '../../resources/js/features/orders/components/form/steps/order-items-step.tsx',
        import.meta.url,
    ),
    'utf8',
);
const customerSearchDialog = readFileSync(
    new URL(
        '../../resources/js/features/customers/components/customer-mobile-search-dialog.tsx',
        import.meta.url,
    ),
    'utf8',
);
const orderSummaries = readFileSync(
    new URL(
        '../../resources/js/components/shared/order-summaries.tsx',
        import.meta.url,
    ),
    'utf8',
);
const commandComponent = readFileSync(
    new URL('../../resources/js/components/ui/command.tsx', import.meta.url),
    'utf8',
);
const retiredCustomerSearchSheet = new URL(
    '../../resources/js/features/customers/components/customer-mobile-search-sheet.tsx',
    import.meta.url,
);

test('customer mobile search reuses the order step catalog dialog', () => {
    assert.match(orderItemsStep, /export function OrderCatalogDialog/);
    assert.match(customerSearchDialog, /<OrderCatalogDialog/);
    assert.doesNotMatch(orderItemsStep, /showSelectionIndicator/);
    assert.doesNotMatch(customerSearchDialog, /showSelectionIndicator/);
    assert.equal(existsSync(retiredCustomerSearchSheet), false);
});

test('shared catalog rows use a three-line layout without a checklist', () => {
    assert.match(orderSummaries, /grid-cols-\[3\.5rem_minmax\(0,1fr\)\]/);
    assert.match(orderSummaries, /size-14/);
    assert.doesNotMatch(orderSummaries, /showSelectionIndicator/);
    assert.doesNotMatch(orderSummaries, /isSelected/);
});

test('shared catalog dialog uses a drawer-like mobile transition', () => {
    assert.match(orderItemsStep, /mobileAnimation="sheet-right"/);
    assert.match(orderItemsStep, /max-sm:right-0/);
    assert.match(orderItemsStep, /max-sm:translate-x-0/);
    assert.match(commandComponent, /max-sm:data-open:duration-500/);
    assert.match(commandComponent, /max-sm:data-open:slide-in-from-right/);
    assert.match(commandComponent, /max-sm:data-closed:duration-300/);
    assert.match(commandComponent, /max-sm:data-closed:slide-out-to-right/);
    assert.match(commandComponent, /overlayClassName/);
    assert.match(commandComponent, /max-sm:data-ending-style:opacity-0/);
    assert.match(commandComponent, /max-sm:transition-opacity/);
    assert.doesNotMatch(orderItemsStep, /data-starting-style/);
});

test('catalog search focuses its input and uses icon filter chips', () => {
    assert.match(orderItemsStep, /initialFocus=\{searchInputRef\}/);
    assert.match(orderItemsStep, /ref=\{searchInputRef\}/);
    assert.match(orderItemsStep, /autoFocus/);
    assert.match(orderItemsStep, /resolveCategoryIconOption\(filter\.icon\)/);
    assert.doesNotMatch(orderItemsStep, /filter\.count/);
});
