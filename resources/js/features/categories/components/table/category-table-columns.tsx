import type { ColumnDef } from '@tanstack/react-table';

import { DataTableDragHandle } from '@/components/data-table';
import type { CategoryRecord } from '@/types';

import {
    CategoryActions,
    CategoryName,
    CategoryStatusControl,
    CategoryTypeBadge,
    CategoryUsage,
} from './category-table-parts';
import type { CategoryTableActions } from './category-table-parts';

type CategoryColumnActions = CategoryTableActions & {
    canMove?: boolean;
    canReorder?: boolean;
};

export function buildCategoryColumns({
    canMove = false,
    canReorder = false,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
}: CategoryColumnActions): ColumnDef<CategoryRecord>[] {
    const columns: ColumnDef<CategoryRecord>[] = [
        {
            accessorKey: 'name',
            header: 'Kategori',
            cell: ({ row }) => <CategoryName category={row.original} />,
            enableHiding: false,
        },
        {
            id: 'type',
            header: 'Tipe',
            accessorFn: (category) => category.type_label,
            cell: ({ row }) => <CategoryTypeBadge category={row.original} />,
        },
        {
            id: 'usage',
            header: 'Pemakaian',
            accessorFn: (category) => category.usage_count,
            cell: ({ row }) => (
                <CategoryUsage category={row.original} stacked />
            ),
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (category) =>
                category.is_active ? 'Aktif' : 'Nonaktif',
            cell: ({ row }) => (
                <CategoryStatusControl
                    category={row.original}
                    onActiveChange={onActiveChange}
                />
            ),
        },
        {
            id: 'actions',
            enableHiding: false,
            enableSorting: false,
            cell: ({ row, table }) => {
                const rows = table.getRowModel().rows;
                const rowIndex = row.index;
                const disableMoveUp = !canMove || !onMove || rowIndex <= 0;
                const disableMoveDown =
                    !canMove || !onMove || rowIndex >= rows.length - 1;

                return (
                    <CategoryActions
                        category={row.original}
                        disableMoveUp={disableMoveUp}
                        disableMoveDown={disableMoveDown}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onMove={onMove}
                    />
                );
            },
        },
    ];

    if (canReorder) {
        columns.unshift({
            id: 'drag',
            header: () => null,
            cell: ({ row }) => (
                <DataTableDragHandle
                    id={row.id}
                    label={`Pindahkan ${row.original.name}`}
                />
            ),
            enableHiding: false,
            enableSorting: false,
        });
    }

    return columns;
}
