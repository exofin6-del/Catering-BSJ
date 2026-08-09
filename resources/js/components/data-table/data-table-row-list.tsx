import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode, Ref } from 'react';

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableActionRowTone = 'default' | 'muted';

type DataTableRowListProps = {
    bodyClassName?: string;
    children: ReactNode;
    childrenAreGroups?: boolean;
    className?: string;
    tableClassName?: string;
};

type DataTableActionRowProps = {
    actions: ReactNode;
    actionsClassName?: string;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
    handle: ReactNode;
    handleClassName?: string;
    isDragging?: boolean;
    rowRef?: Ref<HTMLTableRowElement>;
    style?: CSSProperties;
    tone?: DataTableActionRowTone;
};

type DataTableSortableActionRowProps = DataTableActionRowProps & {
    id: UniqueIdentifier;
};

type DataTableRowGroupProps = {
    children: ReactNode;
    className?: string;
    groupRef?: Ref<HTMLTableSectionElement>;
    isDragging?: boolean;
    style?: CSSProperties;
};

type DataTableSortableRowGroupProps = DataTableRowGroupProps & {
    id: UniqueIdentifier;
};

export function DataTableRowList({
    bodyClassName,
    children,
    childrenAreGroups = false,
    className,
    tableClassName,
}: DataTableRowListProps) {
    return (
        <div className={cn('admin-card overflow-hidden', className)}>
            <Table
                className={cn(
                    'table-fixed border-separate border-spacing-0',
                    tableClassName,
                )}
            >
                {childrenAreGroups ? (
                    children
                ) : (
                    <TableBody
                        className={cn(
                            '**:data-[slot=table-cell]:first:w-12',
                            bodyClassName,
                        )}
                    >
                        {children}
                    </TableBody>
                )}
            </Table>
        </div>
    );
}

export function DataTableRowGroup({
    children,
    className,
    groupRef,
    isDragging,
    style,
}: DataTableRowGroupProps) {
    return (
        <TableBody
            ref={groupRef}
            data-dragging={isDragging}
            className={cn(
                'data-[dragging=true]:relative data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 **:data-[slot=table-cell]:first:w-12',
                className,
            )}
            style={style}
        >
            {children}
        </TableBody>
    );
}

export function DataTableActionRow({
    actions,
    actionsClassName,
    children,
    className,
    contentClassName,
    handle,
    handleClassName,
    isDragging,
    rowRef,
    style,
    tone = 'default',
}: DataTableActionRowProps) {
    return (
        <TableRow
            ref={rowRef}
            data-dragging={isDragging}
            className={cn(
                'group/row relative z-0 transition-colors hover:bg-muted/25 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
                tone === 'muted' && 'bg-muted/25 hover:bg-muted/35',
                className,
            )}
            style={style}
        >
            <TableCell
                className={cn(
                    'w-12 border-b p-2 text-center align-middle group-[.border-b-0]/row:border-b-0',
                    handleClassName,
                )}
            >
                <div className="flex h-10 min-w-0 items-center justify-center">
                    {handle}
                </div>
            </TableCell>
            <TableCell
                className={cn(
                    'border-b p-2 align-middle whitespace-normal group-[.border-b-0]/row:border-b-0',
                    contentClassName,
                )}
            >
                <div className="min-w-0">{children}</div>
            </TableCell>
            <TableCell
                className={cn(
                    'w-48 border-b p-2 align-middle whitespace-normal group-[.border-b-0]/row:border-b-0',
                    actionsClassName,
                )}
            >
                <div className="flex min-w-max flex-wrap items-center justify-end gap-1">
                    {actions}
                </div>
            </TableCell>
        </TableRow>
    );
}

export function DataTableSortableActionRow({
    id,
    style,
    ...props
}: DataTableSortableActionRowProps) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id,
    });

    return (
        <DataTableActionRow
            {...props}
            isDragging={isDragging}
            rowRef={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                ...style,
            }}
        />
    );
}

export function DataTableSortableRowGroup({
    id,
    style,
    ...props
}: DataTableSortableRowGroupProps) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id,
    });

    return (
        <DataTableRowGroup
            {...props}
            groupRef={setNodeRef}
            isDragging={isDragging}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
                ...style,
            }}
        />
    );
}
