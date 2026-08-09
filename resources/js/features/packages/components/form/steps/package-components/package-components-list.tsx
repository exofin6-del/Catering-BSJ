import {
    closestCorners,
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PackagePlus } from 'lucide-react';
import { useId, useMemo } from 'react';

import { DataTableRowList } from '@/components/data-table';

import { PackageComponentRows } from './package-component-rows';
import type { PackageComponentsListProps } from './types';

export function PackageComponentsList({
    components,
    menuItems,
    usedMenuItemIds,
    onAddChoiceMenuItem,
    onMoveComponent,
    onRemoveChoiceItem,
    onRemoveComponent,
    onUpdateChoiceItem,
    onUpdateComponent,
}: PackageComponentsListProps) {
    const sortableId = useId();
    const componentIds = useMemo(
        () => components.map((component) => component.id),
        [components],
    );
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150,
                tolerance: 6,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    if (components.length === 0) {
        return <PackageComponentsEmptyState />;
    }

    function handleDragEnd(event: DragEndEvent): void {
        const { active, over } = event;

        if (!active || !over || active.id === over.id) {
            return;
        }

        const componentId = active.id.toString();
        const oldIndex = components.findIndex(
            (component) => component.id === componentId,
        );
        const newIndex = components.findIndex(
            (component) => component.id === over.id.toString(),
        );

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const direction = newIndex > oldIndex ? 1 : -1;
        const moveCount = Math.abs(newIndex - oldIndex);

        for (let step = 0; step < moveCount; step += 1) {
            onMoveComponent(componentId, direction);
        }
    }

    return (
        <DndContext
            collisionDetection={closestCorners}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
        >
            <DataTableRowList
                childrenAreGroups
                className="rounded-md shadow-none sm:shadow-none sm:backdrop-blur-none"
            >
                <SortableContext
                    items={componentIds}
                    strategy={verticalListSortingStrategy}
                >
                    {components.map((component, index) => (
                        <PackageComponentRows
                            key={component.id}
                            component={component}
                            index={index}
                            menuItems={menuItems}
                            rowCount={components.length}
                            usedMenuItemIds={usedMenuItemIds}
                            onAddChoiceMenuItem={onAddChoiceMenuItem}
                            onMoveComponent={onMoveComponent}
                            onRemoveChoiceItem={onRemoveChoiceItem}
                            onRemoveComponent={onRemoveComponent}
                            onUpdateChoiceItem={onUpdateChoiceItem}
                            onUpdateComponent={onUpdateComponent}
                        />
                    ))}
                </SortableContext>
            </DataTableRowList>
        </DndContext>
    );
}

function PackageComponentsEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border bg-background px-4 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <PackagePlus className="size-6" />
            </div>
            <div className="grid gap-1">
                <p className="text-sm font-medium">Belum ada komponen</p>
                <p className="text-sm text-muted-foreground">
                    Pilih menu aktif untuk mulai menyusun paket.
                </p>
            </div>
        </div>
    );
}
