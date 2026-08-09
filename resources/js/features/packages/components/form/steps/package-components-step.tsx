import { Plus } from 'lucide-react';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import {
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';

import type { PackagePreviewState } from '../../../types/package-types';
import {
    selectedPackageComponentItemMenuItemIds,
    selectedPackageComponentMenuItemIds,
} from '../../../utils/package-form-values';
import { PackageFormSummaryAside } from '../package-form-summary-aside';
import { MenuItemCommandDialog } from './package-components/menu-item-command-dialog';
import { PackageComponentsList } from './package-components/package-components-list';
import type { PackageComponentsStepProps } from './package-components/types';

export function PackageComponentsStep({
    componentError,
    components,
    menuItems,
    preview,
    onAddChoiceMenuItem,
    onAddFixedComponent,
    onMoveComponent,
    onRemoveChoiceItem,
    onRemoveComponent,
    onUpdateChoiceItem,
    onUpdateComponent,
}: PackageComponentsStepProps & {
    preview: PackagePreviewState;
}) {
    const usedMenuItemIds = useMemo(
        () => selectedPackageComponentMenuItemIds(components),
        [components],
    );

    const selectedComponentCount = useMemo(
        () =>
            components.filter(
                (component) =>
                    selectedPackageComponentItemMenuItemIds(component).length >
                    0,
            ).length,
        [components],
    );

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <section className="admin-card min-w-0 p-4 md:p-5">
                <FieldSet className="gap-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <FieldContent className="min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <FieldLegend className="text-base font-semibold text-foreground">
                                    Isi paket
                                </FieldLegend>
                                {selectedComponentCount > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-full px-2 text-xs font-normal"
                                    >
                                        {selectedComponentCount} menu
                                    </Badge>
                                )}
                            </div>
                            <FieldDescription className="text-sm leading-snug">
                                Pilih menu dan atur pilihan yang akan tersedia
                                di dalam paket.
                            </FieldDescription>
                        </FieldContent>

                        <MenuItemCommandDialog
                            items={menuItems}
                            selectedItemIds={usedMenuItemIds}
                            title="Pilih menu paket"
                            description="Pilih menu aktif untuk ditambahkan ke paket."
                            emptyText="Menu tidak ditemukan."
                            searchPlaceholder="Cari menu untuk paket"
                            triggerClassName="w-full gap-2 sm:w-auto"
                            onSelect={onAddFixedComponent}
                        >
                            <Plus className="size-4" />
                            Tambah menu
                        </MenuItemCommandDialog>
                    </div>

                    <FieldGroup className="gap-5">
                        {menuItems.length === 0 ? (
                            <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                Belum ada menu aktif yang bisa dipilih.
                            </div>
                        ) : null}

                        {componentError ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                {componentError}
                            </div>
                        ) : null}

                        <PackageComponentsList
                            components={components}
                            menuItems={menuItems}
                            usedMenuItemIds={usedMenuItemIds}
                            onAddChoiceMenuItem={onAddChoiceMenuItem}
                            onMoveComponent={onMoveComponent}
                            onRemoveChoiceItem={onRemoveChoiceItem}
                            onRemoveComponent={onRemoveComponent}
                            onUpdateChoiceItem={onUpdateChoiceItem}
                            onUpdateComponent={onUpdateComponent}
                        />
                    </FieldGroup>
                </FieldSet>
            </section>

            <PackageFormSummaryAside
                className="admin-card self-start p-4 md:p-5"
                defaultTab="components"
                preview={preview}
                menuItems={menuItems}
            />
        </div>
    );
}
