import { EmptyState } from '@/components/shared/empty-state';
import { TableCell, TableRow } from '@/components/ui/table';

import type { DataTableEmptyState } from './data-table.types';

type DataTableEmptyRowProps = {
    colSpan: number;
    emptyState: DataTableEmptyState;
};

export function DataTableEmptyRow({
    colSpan,
    emptyState,
}: DataTableEmptyRowProps) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-auto p-0">
                <EmptyState
                    className="rounded-none py-12"
                    icon={emptyState.icon}
                    title={emptyState.title}
                    description={emptyState.description ?? emptyState.message}
                />
            </TableCell>
        </TableRow>
    );
}
