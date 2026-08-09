import type { Table as TanStackTable } from '@tanstack/react-table';
import {
    Download,
    FileDown,
    FileSpreadsheet,
    FileText,
    Loader2,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { shouldShowDataTableExportFab } from './data-table-export-state';
import {
    changeDataTableSelectAll,
    getDataTableSelectAllNextValue,
    getDataTableSelectAllState,
} from './data-table-selection';
import type { DataTableSelectAllCheckedState } from './data-table-selection';

export type DataTableExportRow = Record<string, unknown>;

export type DataTableExportFormat = 'excel' | 'pdf' | 'csv';

export type DataTableServerExportQueryValue =
    | boolean
    | null
    | number
    | string
    | undefined;

export type DataTableServerExport = {
    url: string;
    query?: Record<string, DataTableServerExportQueryValue>;
    total?: number;
};

type DataTableServerExportResponse<TData> = {
    data?: TData[];
    total?: number;
};

export type DataTableExportChip = {
    id: string;
    label: string;
    value?: string;
    onRemove: () => void;
};

export type DataTableExportButtonProps<TData> = {
    table: TanStackTable<TData>;
    filename?: string;
    label?: string;
    className?: string;
    formatRow?: (row: TData) => DataTableExportRow;
    chips?: DataTableExportChip[];
    isExportSelectionMode?: boolean;
    onExportSelectionModeChange?: (value: boolean) => void;
    selectedRowCount?: number;
    serverExport?: DataTableServerExport;
};

type ExcelCell =
    | string
    | number
    | boolean
    | Date
    | {
          value: string | number | boolean | Date;
          backgroundColor?: string;
          fontWeight?: 'bold';
      };

type ExcelRow = ExcelCell[];

type DataTableExportFormatOption = {
    Icon: LucideIcon;
    label: string;
    value: DataTableExportFormat;
};

const exportFormatOptions = [
    { Icon: FileSpreadsheet, label: 'Excel', value: 'excel' },
    { Icon: FileText, label: 'PDF', value: 'pdf' },
    { Icon: FileDown, label: 'CSV', value: 'csv' },
] as const satisfies readonly DataTableExportFormatOption[];

export function DataTableExportButton<TData>({
    table,
    filename = 'data',
    label = 'Ekspor',
    className,
    formatRow = defaultFormatRow,
    chips = [],
    isExportSelectionMode: controlledIsExportSelectionMode,
    onExportSelectionModeChange,
    selectedRowCount: controlledSelectedRowCount,
    serverExport,
}: DataTableExportButtonProps<TData>) {
    const metaIsExportSelectionMode =
        table.options.meta?.isExportSelectionMode ?? false;
    const isExportSelectionMode =
        controlledIsExportSelectionMode ?? metaIsExportSelectionMode;
    const setIsExportSelectionMode =
        onExportSelectionModeChange ??
        table.options.meta?.setIsExportSelectionMode;
    const isAllRowsSelected = table.options.meta?.isAllRowsSelected ?? false;
    const clearSelection = table.options.meta?.clearSelection;
    const metaIsSelectionActive =
        table.options.meta?.isSelectionActive ?? metaIsExportSelectionMode;

    const [exportingFormat, setExportingFormat] =
        React.useState<DataTableExportFormat | null>(null);
    const [selectedExportFormat, setSelectedExportFormat] =
        React.useState<DataTableExportFormat>('excel');
    const exporting = exportingFormat !== null;

    const visibleRows = table.getFilteredRowModel().rows;
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const visibleRowCount = visibleRows.length;
    const hasServerExport = serverExport !== undefined;
    const totalRowCount =
        table.options.meta?.totalRowCount ??
        serverExport?.total ??
        visibleRowCount;
    const selectedRowCount =
        controlledSelectedRowCount ??
        table.options.meta?.selectedRowCount ??
        selectedRows.length;
    const serverExportCount = serverExport?.total ?? totalRowCount;
    const hasActiveFilters = chips.length > 0;
    const filterSummary = chips.map(formatChipSummary).join(', ');
    const hasSelectedRows = isAllRowsSelected || selectedRowCount > 0;
    const rowSelectionState = table.getState().rowSelection;
    const selectedRowIds = React.useMemo(
        () =>
            new Set(
                Object.entries(rowSelectionState)
                    .filter(([, selected]) => selected)
                    .map(([rowId]) => rowId),
            ),
        [rowSelectionState],
    );
    const selectAllState = getDataTableSelectAllState({
        isAllRowsSelected,
        rows: table.getRowModel().rows,
        selectedRowIds,
    });
    const availableExportRowCount = hasServerExport
        ? serverExportCount
        : visibleRowCount;
    const exportRowCount = isAllRowsSelected
        ? hasServerExport
            ? serverExportCount
            : totalRowCount
        : selectedRowCount > 0
          ? selectedRowCount
          : availableExportRowCount;
    const displayedExportRowCount = hasSelectedRows ? exportRowCount : 0;
    const exportScopeTitle = getExportScopeTitle({
        hasActiveFilters,
        hasSelectedRows,
        isAllRowsSelected,
        selectedRowCount,
    });
    const exportScopeDescription = getExportScopeDescription({
        exportRowCount: displayedExportRowCount,
        filterSummary,
        hasActiveFilters,
        hasServerExport,
        hasSelectedRows,
        isAllRowsSelected,
        selectedRowCount,
    });
    const showCancelButton =
        isExportSelectionMode || isAllRowsSelected || selectedRowCount > 0;

    const showExportFab = shouldShowDataTableExportFab({
        isExportSelectionMode,
        isSelectionActive: metaIsSelectionActive,
        selectedRowCount,
    });
    const selectedExportFormatOption =
        getExportFormatOption(selectedExportFormat);
    const SelectedExportFormatIcon = selectedExportFormatOption.Icon;

    function resetExportSelection(): void {
        if (clearSelection) {
            clearSelection();

            return;
        }

        table.resetRowSelection();
    }

    async function exportSelected(targetFormat: DataTableExportFormat) {
        if (!hasSelectedRows) {
            return;
        }

        setExportingFormat(targetFormat);

        try {
            let rows: TData[] = [];

            if (isAllRowsSelected) {
                rows =
                    hasServerExport && serverExport
                        ? await fetchServerExportRows<TData>(serverExport)
                        : visibleRows.map((row) => row.original);
            } else if (selectedRowCount > 0) {
                rows = selectedRows.map((row) => row.original);
            } else if (hasServerExport && serverExport) {
                rows = await fetchServerExportRows<TData>(serverExport);
            } else {
                rows = visibleRows.map((row) => row.original);
            }

            const records = rows.map((row) => formatRow(row));

            if (records.length === 0) {
                return;
            }

            switch (targetFormat) {
                case 'excel':
                    await exportExcel(records, filename);
                    break;
                case 'pdf':
                    await exportPdf(records, filename);
                    break;
                case 'csv':
                    exportCsv(records, filename);
                    break;
            }

            resetExportSelection();
            setIsExportSelectionMode?.(false);
        } catch (err) {
            console.error(err);
        } finally {
            setExportingFormat(null);
        }
    }

    return (
        <>
            {!showCancelButton ? (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={availableExportRowCount === 0}
                    className={cn('shrink-0 gap-1.5', className)}
                    onClick={() => setIsExportSelectionMode?.(true)}
                >
                    <Download className="size-4" />
                    {label}
                </Button>
            ) : (
                <div
                    className={cn(
                        'flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:justify-end',
                        className,
                    )}
                >
                    <DataTableExportSelectAll
                        checked={selectAllState.checked}
                        disabled={selectAllState.selectablePageRowCount === 0}
                        table={table}
                    />

                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="pointer-events-auto shrink-0 gap-1.5"
                        onClick={() => {
                            resetExportSelection();
                            setIsExportSelectionMode?.(false);
                        }}
                    >
                        <X className="size-4" />
                        Batalkan
                    </Button>
                </div>
            )}

            {showExportFab ? (
                <div className="fixed inset-x-4 bottom-6 z-[9999] mx-auto flex max-w-3xl animate-in flex-col gap-4 rounded-[1.25rem] border border-border/50 bg-background/85 p-3.5 shadow-2xl shadow-primary/5 backdrop-blur-xl duration-300 slide-in-from-bottom-8 sm:bottom-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:rounded-full sm:py-3 sm:pr-3 sm:pl-5">
                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                        <div className="flex min-w-0 flex-1 items-center gap-3.5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Download className="size-4.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold tracking-tight">
                                        {exportScopeTitle}
                                    </span>
                                    <span
                                        className={cn(
                                            'inline-flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold tabular-nums transition-colors',
                                            hasSelectedRows
                                                ? 'bg-primary/15 text-primary'
                                                : 'bg-muted text-muted-foreground',
                                        )}
                                    >
                                        {formatRowCount(
                                            displayedExportRowCount,
                                        )}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-muted-foreground/80">
                                    {exportScopeDescription}
                                </p>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="pointer-events-auto -mr-1 size-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:hidden"
                            onClick={() => {
                                if (isExportSelectionMode) {
                                    setIsExportSelectionMode?.(false);
                                }

                                resetExportSelection();
                            }}
                        >
                            <X className="size-4" />
                            <span className="sr-only">
                                Tutup pilihan ekspor
                            </span>
                        </Button>
                    </div>

                    <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
                        <div className="flex w-full items-center gap-2 sm:hidden">
                            <Select
                                value={selectedExportFormat}
                                onValueChange={(value) =>
                                    setSelectedExportFormat(
                                        value as DataTableExportFormat,
                                    )
                                }
                                disabled={exporting || !hasSelectedRows}
                            >
                                <SelectTrigger
                                    aria-label="Pilih format ekspor"
                                    className="pointer-events-auto h-10 flex-1 rounded-xl border-border/50 bg-background/50 text-xs font-medium"
                                >
                                    <SelectValue placeholder="Pilih format" />
                                </SelectTrigger>
                                <SelectContent
                                    align="center"
                                    className="z-[10000] rounded-xl"
                                    side="top"
                                    sideOffset={8}
                                >
                                    {exportFormatOptions.map(
                                        ({ Icon, label, value }) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                                className="rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Icon className="size-4 text-muted-foreground" />
                                                    <span className="font-medium">
                                                        {label}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                disabled={exporting || !hasSelectedRows}
                                onClick={() =>
                                    exportSelected(selectedExportFormat)
                                }
                                className="pointer-events-auto h-10 shrink-0 rounded-xl px-5 text-xs font-semibold shadow-none"
                            >
                                {exporting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <SelectedExportFormatIcon className="mr-1.5 size-4" />
                                )}
                                Unduh
                            </Button>
                        </div>

                        <div className="hidden items-center gap-1.5 sm:flex sm:border-l sm:border-border/50 sm:pl-4">
                            {exportFormatOptions.map(
                                ({ Icon, label, value }) => (
                                    <Button
                                        key={value}
                                        type="button"
                                        variant={
                                            exportingFormat === value
                                                ? 'default'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        disabled={exporting || !hasSelectedRows}
                                        onClick={() => exportSelected(value)}
                                        className={cn(
                                            'pointer-events-auto h-9 rounded-full px-3.5 text-xs font-medium transition-all',
                                            exportingFormat === value
                                                ? 'shadow-sm'
                                                : 'hover:bg-muted',
                                        )}
                                    >
                                        {exportingFormat === value ? (
                                            <Loader2 className="mr-1.5 -ml-1 size-3.5 animate-spin" />
                                        ) : (
                                            <Icon className="mr-1.5 -ml-1 size-3.5" />
                                        )}
                                        {label}
                                    </Button>
                                ),
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="pointer-events-auto hidden size-9 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:ml-2 sm:inline-flex"
                            onClick={() => {
                                if (isExportSelectionMode) {
                                    setIsExportSelectionMode?.(false);
                                }

                                resetExportSelection();
                            }}
                        >
                            <X className="size-4" />
                            <span className="sr-only">
                                Tutup pilihan ekspor
                            </span>
                        </Button>
                    </div>
                </div>
            ) : null}
        </>
    );
}

function DataTableExportSelectAll<TData>({
    checked,
    disabled,
    table,
}: {
    checked: DataTableSelectAllCheckedState;
    disabled: boolean;
    table: TanStackTable<TData>;
}) {
    const nextValue = getDataTableSelectAllNextValue(checked);
    const label = checked === true ? 'Semua dipilih' : 'Pilih semua';

    return (
        <div className="pointer-events-auto flex h-8 min-w-0 shrink-0 items-center gap-2 rounded-md px-1 sm:hidden">
            <Checkbox
                checked={checked}
                disabled={disabled}
                aria-label="Pilih semua hasil"
                onCheckedChange={(value) =>
                    changeDataTableSelectAll({ table, value })
                }
            />
            <button
                type="button"
                disabled={disabled}
                className="inline-flex h-8 min-w-0 items-center truncate rounded-md text-sm leading-none font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() =>
                    changeDataTableSelectAll({
                        table,
                        value: nextValue,
                    })
                }
            >
                {label}
            </button>
        </div>
    );
}

function getExportFormatOption(
    format: DataTableExportFormat,
): DataTableExportFormatOption {
    return (
        exportFormatOptions.find((option) => option.value === format) ??
        exportFormatOptions[0]
    );
}

function formatChipSummary(chip: DataTableExportChip): string {
    return chip.value ? `${chip.label}: ${chip.value}` : chip.label;
}

function formatRowCount(value: number): string {
    return value.toLocaleString('id-ID');
}

function getExportScopeTitle({
    hasActiveFilters,
    hasSelectedRows,
    isAllRowsSelected,
    selectedRowCount,
}: {
    hasActiveFilters: boolean;
    hasSelectedRows: boolean;
    isAllRowsSelected: boolean;
    selectedRowCount: number;
}): string {
    if (!hasSelectedRows) {
        return 'Silakan pilih';
    }

    if (isAllRowsSelected) {
        return 'Semua hasil dipilih';
    }

    if (selectedRowCount > 0) {
        return 'Baris dipilih';
    }

    if (hasActiveFilters) {
        return 'Ekspor hasil filter';
    }

    return 'Ekspor semua data';
}

function getExportScopeDescription({
    exportRowCount,
    filterSummary,
    hasActiveFilters,
    hasServerExport,
    hasSelectedRows,
    isAllRowsSelected,
    selectedRowCount,
}: {
    exportRowCount: number;
    filterSummary: string;
    hasActiveFilters: boolean;
    hasServerExport: boolean;
    hasSelectedRows: boolean;
    isAllRowsSelected: boolean;
    selectedRowCount: number;
}): string {
    const rowCountLabel = `${formatRowCount(exportRowCount)} baris`;

    if (!hasSelectedRows) {
        return 'Pilih baris yang ingin diekspor.';
    }

    if (isAllRowsSelected) {
        return `${rowCountLabel} dari semua hasil yang cocok.`;
    }

    if (selectedRowCount > 0) {
        return `${rowCountLabel} akan diekspor.`;
    }

    if (hasActiveFilters && filterSummary) {
        return `Filter: ${filterSummary}`;
    }

    if (hasServerExport) {
        return `${rowCountLabel} tersedia dari server.`;
    }

    return `${rowCountLabel} tersedia.`;
}

function defaultFormatRow<TData>(row: TData): DataTableExportRow {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
        return row as DataTableExportRow;
    }

    return { value: row };
}

async function fetchServerExportRows<TData>(
    serverExport: DataTableServerExport,
): Promise<TData[]> {
    const url = new URL(serverExport.url, window.location.origin);

    if (serverExport.query) {
        Object.entries(serverExport.query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.append(key, String(value));
            }
        });
    }

    const response = await window.fetch(url.toString(), {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error('Gagal mengambil data ekspor.');
    }

    const json =
        (await response.json()) as DataTableServerExportResponse<TData>;

    return json.data ?? [];
}

async function exportExcel(
    records: DataTableExportRow[],
    filename: string,
): Promise<void> {
    const headers = getHeaders(records);
    const rows: ExcelRow[] = [
        headers.map((header) => ({
            value: header,
            fontWeight: 'bold',
            backgroundColor: 'F3F4F6',
        })),
        ...records.map((record) =>
            headers.map((header) => toExcelCellValue(record[header])),
        ),
    ];
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    return writeXlsxFile(rows, {
        columns: headers.map((header) => ({
            width: Math.min(Math.max(header.length + 4, 12), 32),
        })),
        sheet: 'Data',
    }).toFile(fileNameWithExtension(filename, 'xlsx'));
}

async function exportPdf(
    records: DataTableExportRow[],
    filename: string,
): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const doc = new jsPDF();
    const headers = getHeaders(records);
    const data = records.map((record) =>
        headers.map((header) => serializeCell(record[header])),
    );

    autoTable(doc, {
        head: [headers],
        body: data,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    doc.save(fileNameWithExtension(filename, 'pdf'));
}

function exportCsv(records: DataTableExportRow[], filename: string) {
    const headers = getHeaders(records);
    const csvContent = [
        headers.map(escapeCsvCell).join(','),
        ...records.map((record) =>
            headers.map((header) => escapeCsvCell(record[header])).join(','),
        ),
    ].join('\r\n');

    const blob = new Blob([`\uFEFF${csvContent}`], {
        type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileNameWithExtension(filename, 'csv');
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function getHeaders(records: DataTableExportRow[]): string[] {
    return records.reduce<string[]>((currentHeaders, record) => {
        Object.keys(record).forEach((key) => {
            if (!currentHeaders.includes(key)) {
                currentHeaders.push(key);
            }
        });

        return currentHeaders;
    }, []);
}

function escapeCsvCell(value: unknown): string {
    const serializedValue = serializeCell(value);
    const escapedValue = serializedValue.replace(/"/g, '""');

    if (/[",\n\r]/.test(escapedValue)) {
        return `"${escapedValue}"`;
    }

    return escapedValue;
}

function serializeCell(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof Date) {
        return value.toLocaleString();
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

function toExcelCellValue(value: unknown): string | number | boolean | Date {
    if (value === null || value === undefined) {
        return '';
    }

    if (value instanceof Date) {
        return value;
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        return value;
    }

    return JSON.stringify(value);
}

function fileNameWithExtension(filename: string, extension: string): string {
    return `${filename.replace(/\.[^/.]+$/, '')}.${extension}`;
}
