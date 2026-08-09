export type DataTableExportFabState = {
    isExportSelectionMode: boolean;
    isSelectionActive?: boolean;
    selectedRowCount: number;
};

export function shouldShowDataTableExportFab({
    isExportSelectionMode,
    isSelectionActive,
    selectedRowCount,
}: DataTableExportFabState): boolean {
    return (
        isExportSelectionMode || (!!isSelectionActive && selectedRowCount > 0)
    );
}

export function dataTableExportSelectionLabel(
    selectedRowCount: number,
): string {
    return `${selectedRowCount.toLocaleString('id-ID')} baris dipilih`;
}
