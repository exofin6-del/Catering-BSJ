import type { ColumnDef } from '@tanstack/react-table';

import { DataTableDragHandle } from '@/components/data-table';
import type { MenuPackage } from '@/types';

import { summarizePackagePrice } from '../../utils/package-price';
import {
    PackageActions,
    PackageName,
    PackagePrice,
    PackageStatusControl,
} from './package-table-parts';
import type { PackageTableActions } from './package-table-parts';

type PackageColumnActions = PackageTableActions & {
    canMove?: boolean;
    canReorder?: boolean;
};

export function buildPackageColumns({
    canMove = false,
    canReorder = false,
    onActiveChange,
    onDelete,
    onEdit,
    onMove,
    onView,
}: PackageColumnActions): ColumnDef<MenuPackage>[] {
    const columns: ColumnDef<MenuPackage>[] = [
        {
            accessorKey: 'name',
            cell: ({ row }) => <PackageName item={row.original} />,
            enableHiding: false,
            header: 'Paket',
        },
        {
            accessorFn: (item) => summarizePackagePrice(item).activePrice,
            cell: ({ row }) => <PackagePrice item={row.original} stacked />,
            header: 'Harga',
            id: 'price',
        },
        {
            accessorFn: (item) => item.items_count ?? item.items.length,
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.items_count ?? row.original.items.length}{' '}
                    komponen
                </span>
            ),
            header: 'Komponen',
            id: 'components',
        },
        {
            accessorFn: (item) => (item.is_active ? 'Aktif' : 'Nonaktif'),
            cell: ({ row }) => (
                <PackageStatusControl
                    item={row.original}
                    onActiveChange={onActiveChange}
                />
            ),
            header: 'Status',
            id: 'status',
        },
        {
            cell: ({ row, table }) => {
                const rows = table.getRowModel().rows;
                const rowIndex = row.index;
                const disableMoveUp = !canMove || !onMove || rowIndex <= 0;
                const disableMoveDown =
                    !canMove || !onMove || rowIndex >= rows.length - 1;

                return (
                    <PackageActions
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
            enableHiding: false,
            enableSorting: false,
            id: 'actions',
        },
    ];

    if (canReorder) {
        columns.unshift({
            cell: ({ row }) => (
                <DataTableDragHandle
                    id={row.id}
                    label={`Pindahkan ${row.original.name}`}
                />
            ),
            enableHiding: false,
            enableSorting: false,
            header: () => null,
            id: 'drag',
        });
    }

    return columns;
}
