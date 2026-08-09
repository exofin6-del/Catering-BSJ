import type { ColumnDef } from '@tanstack/react-table';

import { DataTableDragHandle } from '@/components/data-table';
import type { MenuItem } from '@/types';

import { resolveMenuPrice } from '../../utils/menu-price';
import {
    MenuActions,
    MenuName,
    MenuPrice,
    MenuStatusControl,
} from './menu-table-parts';
import type { MenuTableActions } from './menu-table-parts';

type MenuColumnActions = MenuTableActions & {
    canMove?: boolean;
    canReorder?: boolean;
};

export function buildMenuColumns({
    canMove = false,
    canReorder = false,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
    onView,
}: MenuColumnActions): ColumnDef<MenuItem>[] {
    const columns: ColumnDef<MenuItem>[] = [
        {
            accessorKey: 'name',
            header: 'Menu',
            cell: ({ row }) => <MenuName item={row.original} />,
            enableHiding: false,
        },
        {
            id: 'price',
            header: 'Harga',
            accessorFn: (item) => resolveMenuPrice(item).sortValue,
            cell: ({ row }) => <MenuPrice item={row.original} stacked />,
        },
        {
            id: 'status',
            header: 'Status',
            accessorFn: (item) => (item.is_active ? 'Aktif' : 'Nonaktif'),
            cell: ({ row }) => (
                <MenuStatusControl
                    item={row.original}
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
                    <MenuActions
                        item={row.original}
                        disableMoveUp={disableMoveUp}
                        disableMoveDown={disableMoveDown}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onMove={onMove}
                        onView={onView}
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
