import { Plus } from 'lucide-react';
import { useState } from 'react';

import {
    DataTableActionRow,
    DataTableDragHandle,
    DataTableSortableRowGroup,
} from '@/components/data-table';
import { Input } from '@/components/ui/input';
import type { PackageMenuItem } from '@/types';

import type {
    PackageChoiceFormItem,
    PackageComponentFormItem,
    PackagePriceMode,
} from '../../../../types/package-types';
import {
    findMenuItem,
    packagePriceForMode,
} from '../../../../utils/package-form-values';
import {
    PackageChoiceActionMenu,
    PackageComponentActionMenu,
} from './component-action-menu';
import { ComponentPriceControl } from './component-price-control';
import { MenuItemCommandDialog } from './menu-item-command-dialog';
import { MenuItemSummary } from './menu-item-summary';
import type { PackageComponentsStepProps } from './types';

export function PackageComponentRows({
    component,
    index,
    menuItems,
    rowCount,
    usedMenuItemIds,
    onAddChoiceMenuItem,
    onMoveComponent,
    onRemoveChoiceItem,
    onRemoveComponent,
    onUpdateChoiceItem,
    onUpdateComponent,
}: {
    component: PackageComponentFormItem;
    index: number;
    menuItems: PackageMenuItem[];
    rowCount: number;
    usedMenuItemIds: number[];
} & Pick<
    PackageComponentsStepProps,
    | 'onAddChoiceMenuItem'
    | 'onMoveComponent'
    | 'onRemoveChoiceItem'
    | 'onRemoveComponent'
    | 'onUpdateChoiceItem'
    | 'onUpdateComponent'
>) {
    const isFirst = index === 0;
    const isLast = index >= rowCount - 1;

    if (component.type === 'choice') {
        return (
            <DataTableSortableRowGroup id={component.id}>
                <PackageChoiceComponentHeaderRow
                    component={component}
                    disabledDown={isLast}
                    disabledUp={isFirst}
                    hasChoiceItems={component.itemPrices.length > 0}
                    menuItems={menuItems}
                    usedMenuItemIds={usedMenuItemIds}
                    onAddChoiceMenuItem={onAddChoiceMenuItem}
                    onMoveComponent={onMoveComponent}
                    onRemoveComponent={onRemoveComponent}
                    onUpdateComponent={onUpdateComponent}
                />

                {component.itemPrices.map((choice, choiceIndex) => (
                    <PackageChoiceItemRow
                        key={choice.id}
                        choice={choice}
                        choiceCount={component.itemPrices.length}
                        choiceIndex={choiceIndex}
                        componentId={component.id}
                        menuItems={menuItems}
                        onRemoveChoiceItem={onRemoveChoiceItem}
                        onUpdateChoiceItem={onUpdateChoiceItem}
                    />
                ))}
            </DataTableSortableRowGroup>
        );
    }

    return (
        <PackageFixedComponentRow
            component={component}
            disabledDown={isLast}
            disabledUp={isFirst}
            menuItems={menuItems}
            usedMenuItemIds={usedMenuItemIds}
            onAddChoiceMenuItem={onAddChoiceMenuItem}
            onMoveComponent={onMoveComponent}
            onRemoveComponent={onRemoveComponent}
            onUpdateComponent={onUpdateComponent}
        />
    );
}

function PackageFixedComponentRow({
    component,
    disabledDown,
    disabledUp,
    menuItems,
    usedMenuItemIds,
    onAddChoiceMenuItem,
    onMoveComponent,
    onRemoveComponent,
    onUpdateComponent,
}: {
    component: PackageComponentFormItem;
    disabledDown: boolean;
    disabledUp: boolean;
    menuItems: PackageMenuItem[];
    usedMenuItemIds: number[];
} & Pick<
    PackageComponentsStepProps,
    | 'onAddChoiceMenuItem'
    | 'onMoveComponent'
    | 'onRemoveComponent'
    | 'onUpdateComponent'
>) {
    const menuItem = findMenuItem(menuItems, component.menuItemId);
    const [isChoicePickerOpen, setIsChoicePickerOpen] = useState(false);
    const hasAvailableChoiceItems = menuItems.some(
        (item) => !usedMenuItemIds.includes(item.id),
    );

    function updateFixedPriceMode(priceMode: PackagePriceMode): void {
        const packagePrice = packagePriceForMode(
            menuItem,
            priceMode,
            component.packagePrice,
        );

        onUpdateComponent(component.id, 'priceMode', priceMode);
        onUpdateComponent(component.id, 'packagePrice', packagePrice);
    }

    return (
        <>
            <DataTableSortableRowGroup id={component.id}>
                <DataTableActionRow
                    handle={
                        <MoveHandle
                            id={component.id}
                            label="Ubah urutan komponen"
                        />
                    }
                    actions={
                        <>
                            <ComponentPriceControl
                                inputId={`${component.id}-price`}
                                menuItem={menuItem}
                                packagePrice={component.packagePrice}
                                priceMode={component.priceMode}
                                onCustomPriceChange={(value) =>
                                    onUpdateComponent(
                                        component.id,
                                        'packagePrice',
                                        value,
                                    )
                                }
                                onPriceModeChange={updateFixedPriceMode}
                            />

                            <PackageComponentActionMenu
                                createChoiceDisabled={!hasAvailableChoiceItems}
                                deleteLabel="Hapus komponen"
                                disabledDown={disabledDown}
                                disabledUp={disabledUp}
                                onCreateChoice={() =>
                                    setIsChoicePickerOpen(true)
                                }
                                onDelete={() => onRemoveComponent(component.id)}
                                onMoveDown={() =>
                                    onMoveComponent(component.id, 1)
                                }
                                onMoveUp={() =>
                                    onMoveComponent(component.id, -1)
                                }
                            />
                        </>
                    }
                >
                    <MenuItemSummary
                        menuItem={menuItem}
                        name={
                            component.name || menuItem?.name || 'Komponen paket'
                        }
                        packagePrice={component.packagePrice}
                    />
                </DataTableActionRow>
            </DataTableSortableRowGroup>

            <MenuItemCommandDialog
                hideTrigger
                open={isChoicePickerOpen}
                items={menuItems}
                selectedItemIds={usedMenuItemIds}
                title="Pilih alternatif menu"
                description="Menu yang dipilih akan menjadi alternatif pada komponen ini."
                emptyText="Tidak ada menu alternatif tersedia."
                searchPlaceholder="Cari menu alternatif"
                onOpenChange={setIsChoicePickerOpen}
                onSelect={(menuItem) =>
                    onAddChoiceMenuItem(component.id, menuItem)
                }
            />
        </>
    );
}

function PackageChoiceComponentHeaderRow({
    component,
    disabledDown,
    disabledUp,
    hasChoiceItems,
    menuItems,
    usedMenuItemIds,
    onAddChoiceMenuItem,
    onMoveComponent,
    onRemoveComponent,
    onUpdateComponent,
}: {
    component: PackageComponentFormItem;
    disabledDown: boolean;
    disabledUp: boolean;
    hasChoiceItems: boolean;
    menuItems: PackageMenuItem[];
    usedMenuItemIds: number[];
} & Pick<
    PackageComponentsStepProps,
    | 'onAddChoiceMenuItem'
    | 'onMoveComponent'
    | 'onRemoveComponent'
    | 'onUpdateComponent'
>) {
    return (
        <DataTableActionRow
            className={hasChoiceItems ? 'border-b-0' : undefined}
            // tone="muted"
            handle={
                <MoveHandle
                    id={component.id}
                    label="Ubah urutan grup pilihan"
                />
            }
            actions={
                <>
                    <MenuItemCommandDialog
                        items={menuItems}
                        selectedItemIds={usedMenuItemIds}
                        title="Pilih alternatif menu"
                        description="Menu yang dipilih akan menjadi alternatif pada komponen ini."
                        emptyText="Tidak ada menu alternatif tersedia."
                        searchPlaceholder="Cari menu alternatif"
                        triggerClassName="h-8 px-2 text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground"
                        triggerSize="sm"
                        triggerVariant="ghost"
                        onSelect={(menuItem) =>
                            onAddChoiceMenuItem(component.id, menuItem)
                        }
                    >
                        <Plus className="size-4" />
                        <span>Tambah</span>
                    </MenuItemCommandDialog>

                    <PackageComponentActionMenu
                        deleteLabel="Hapus grup"
                        disabledDown={disabledDown}
                        disabledUp={disabledUp}
                        onDelete={() => onRemoveComponent(component.id)}
                        onMoveDown={() => onMoveComponent(component.id, 1)}
                        onMoveUp={() => onMoveComponent(component.id, -1)}
                    />
                </>
            }
        >
            <Input
                className="h-9 min-w-0 border-transparent bg-transparent px-0 text-sm font-semibold shadow-none transition-all placeholder:text-muted-foreground focus-visible:border-input focus-visible:bg-background focus-visible:px-3"
                value={component.name}
                placeholder="Pilihan Paket"
                aria-label="Nama grup pilihan"
                onChange={(event) =>
                    onUpdateComponent(component.id, 'name', event.target.value)
                }
            />
        </DataTableActionRow>
    );
}

function PackageChoiceItemRow({
    choice,
    choiceCount,
    choiceIndex,
    componentId,
    menuItems,
    onRemoveChoiceItem,
    onUpdateChoiceItem,
}: {
    choice: PackageChoiceFormItem;
    choiceCount: number;
    choiceIndex: number;
    componentId: string;
    menuItems: PackageMenuItem[];
} & Pick<
    PackageComponentsStepProps,
    'onRemoveChoiceItem' | 'onUpdateChoiceItem'
>) {
    const menuItem = findMenuItem(menuItems, choice.menuItemId);

    function updateChoicePriceMode(priceMode: PackagePriceMode): void {
        const packagePrice = packagePriceForMode(
            menuItem,
            priceMode,
            choice.packagePrice,
        );

        onUpdateChoiceItem(componentId, choice.id, 'priceMode', priceMode);
        onUpdateChoiceItem(
            componentId,
            choice.id,
            'packagePrice',
            packagePrice,
        );
    }

    return (
        <DataTableActionRow
            className={choiceIndex < choiceCount - 1 ? 'border-b-0' : undefined}
            handle={<ChoiceNumber value={choiceIndex + 1} />}
            actions={
                <>
                    <ComponentPriceControl
                        inputId={`${componentId}-${choice.id}-price`}
                        menuItem={menuItem}
                        packagePrice={choice.packagePrice}
                        priceMode={choice.priceMode}
                        onCustomPriceChange={(value) =>
                            onUpdateChoiceItem(
                                componentId,
                                choice.id,
                                'packagePrice',
                                value,
                            )
                        }
                        onPriceModeChange={updateChoicePriceMode}
                    />

                    <PackageChoiceActionMenu
                        disabledDelete={choiceCount <= 1}
                        isRecommended={choice.isRecommended}
                        onDelete={() =>
                            onRemoveChoiceItem(componentId, choice.id)
                        }
                        onRecommendedChange={(checked) =>
                            onUpdateChoiceItem(
                                componentId,
                                choice.id,
                                'isRecommended',
                                checked,
                            )
                        }
                    />
                </>
            }
        >
            <MenuItemSummary
                isRecommended={choice.isRecommended}
                menuItem={menuItem}
                name={menuItem?.name ?? 'Pilihan menu'}
                packagePrice={choice.packagePrice}
            />
        </DataTableActionRow>
    );
}

function MoveHandle({ id, label }: { id: string; label: string }) {
    return <DataTableDragHandle id={id} label={label} />;
}

function ChoiceNumber({ value }: { value: number }) {
    return (
        <span className="block w-6 text-center text-xs font-semibold text-muted-foreground tabular-nums">
            {value}
        </span>
    );
}
