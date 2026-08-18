import { endOfMonth, format, startOfMonth } from 'date-fns';
import {
    ChevronLeft,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { ReportDateRangePicker } from '@/features/reports/components/shared/report-date-range-picker';
import { cn } from '@/lib/utils';
import schedule from '@/routes/schedule';

import type { ScheduleItem } from '../types/schedule-types';
import {
    getCachedScheduleItems,
    getScheduleExportItems,
} from '../utils/schedule-export-cache';
import { buildScheduleExportQuery } from '../utils/schedule-export-query';
import type { ScheduleExportPeriod } from '../utils/schedule-export-query';
import {
    formatScheduleMenuItems,
    formatScheduleGoogleMapsUrl,
} from '../utils/schedule-format';
import { ScheduleListEmptyState, ScheduleListItem } from './schedule-list-card';

type ScheduleExportFormat = 'excel' | 'pdf';

const PREVIEW_LIMIT = 4;

function scheduleExportCacheKey(
    period: ScheduleExportPeriod,
    startDate: string,
    endDate: string,
): string {
    return `${period}:${startDate}:${endDate}`;
}

function scheduleExportUrl(
    period: ScheduleExportPeriod,
    startDate: string,
    endDate: string,
): string {
    return schedule.export.url({
        query: buildScheduleExportQuery(period, startDate, endDate),
    });
}

export function ScheduleExportDropdown() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const [open, setOpen] = useState(false);
    const [period, setPeriod] = useState<ScheduleExportPeriod>('month');
    const [startDate, setStartDate] = useState(monthStart);
    const [endDate, setEndDate] = useState(monthEnd);
    const [exportItems, setExportItems] = useState<ScheduleItem[]>([]);
    const [visibleCount, setVisibleCount] = useState(PREVIEW_LIMIT);
    const [isLoadingItems, setIsLoadingItems] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [exportingFormat, setExportingFormat] =
        useState<ScheduleExportFormat | null>(null);
    const isDateRangeComplete = startDate !== '' && endDate !== '';
    const isPeriodReady = period === 'all' || isDateRangeComplete;

    useEffect(() => {
        if (!isPeriodReady) {
            return;
        }

        const requestUrl = scheduleExportUrl(period, startDate, endDate);
        const cacheKey = scheduleExportCacheKey(period, startDate, endDate);
        const cachedItems = getCachedScheduleItems(cacheKey);
        let isActive = true;

        if (cachedItems !== null) {
            queueMicrotask(() => {
                if (!isActive) {
                    return;
                }

                setExportItems(cachedItems);
                setLoadError(null);
                setIsLoadingItems(false);
            });

            return () => {
                isActive = false;
            };
        }

        const loadItems = () =>
            getScheduleExportItems(cacheKey, () =>
                fetchScheduleExportItems(requestUrl),
            );

        if (!open) {
            void loadItems().catch((error: unknown) => {
                console.error('Gagal melakukan prefetch jadwal ekspor.', error);
            });

            return () => {
                isActive = false;
            };
        }

        queueMicrotask(() => {
            if (!isActive) {
                return;
            }

            setIsLoadingItems(true);
            setLoadError(null);
        });

        void loadItems()
            .then((items) => {
                if (!isActive) {
                    return;
                }

                setExportItems(items);
            })
            .catch((error: unknown) => {
                if (!isActive) {
                    return;
                }

                console.error('Gagal memuat data ekspor jadwal.', error);
                setExportItems([]);
                setLoadError('Data jadwal belum dapat dimuat. Coba lagi.');
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingItems(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [endDate, isPeriodReady, open, period, startDate]);

    async function handleExport(format: ScheduleExportFormat): Promise<void> {
        if (exportItems.length === 0) {
            return;
        }

        setExportingFormat(format);

        try {
            const records = exportItems.map(formatScheduleExportRow);

            if (format === 'excel') {
                await exportExcel(records);
            } else {
                await exportPdf(records);
            }
        } catch (error) {
            console.error('Gagal mengekspor jadwal.', error);
        } finally {
            setExportingFormat(null);
        }
    }

    function selectPeriod(nextPeriod: Exclude<ScheduleExportPeriod, 'custom'>) {
        setPeriod(nextPeriod);
        setVisibleCount(PREVIEW_LIMIT);

        if (nextPeriod === 'all') {
            setStartDate('');
            setEndDate('');

            return;
        }

        if (nextPeriod === 'today') {
            setStartDate(today);
            setEndDate(today);

            return;
        }

        setStartDate(monthStart);
        setEndDate(monthEnd);
    }

    const previewItems = exportItems.slice(0, visibleCount);
    const hasMoreItems = visibleCount < exportItems.length;
    const canShowLess = visibleCount > PREVIEW_LIMIT;
    const isExporting = exportingFormat !== null;
    const exportDisabled =
        isExporting ||
        isLoadingItems ||
        !isPeriodReady ||
        exportItems.length === 0;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-2.5 sm:px-3"
                onClick={() => {
                    const cacheKey = scheduleExportCacheKey(
                        period,
                        startDate,
                        endDate,
                    );
                    const cachedItems = getCachedScheduleItems(cacheKey);

                    setExportItems(cachedItems ?? []);
                    setLoadError(null);
                    setIsLoadingItems(cachedItems === null);
                    setVisibleCount(PREVIEW_LIMIT);
                    setOpen(true);
                }}
            >
                <Download className="size-4" />
                <span className="sr-only sm:not-sr-only">Ekspor</span>
            </Button>

            <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
                <DrawerContent className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[28rem] max-sm:m-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:[--drawer-inset:0px] sm:w-[28rem]">
                    {/* Header */}
                    <DrawerHeader className="border-b px-5 py-4">
                        <div className="flex items-center gap-3">
                            <DrawerClose
                                type="button"
                                aria-label="Kembali"
                                className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
                            >
                                <ChevronLeft className="size-6" />
                            </DrawerClose>

                            <div className="min-w-0">
                                <DrawerTitle className="text-lg font-semibold">
                                    Ekspor jadwal
                                </DrawerTitle>

                                <DrawerDescription className="mt-0.5 text-xs">
                                    Atur periode dan pilih format dokumen.
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    {/* Body */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <div className="space-y-4">
                            <section className="grid gap-2">
                                <div className="grid grid-cols-3 gap-1.5 rounded-md bg-muted/50 p-1 shadow-none">
                                    <PeriodButton
                                        active={period === 'today'}
                                        label="Hari ini"
                                        onClick={() => selectPeriod('today')}
                                    />

                                    <PeriodButton
                                        active={period === 'month'}
                                        label="Bulan ini"
                                        onClick={() => selectPeriod('month')}
                                    />

                                    <PeriodButton
                                        active={period === 'all'}
                                        label="Semua"
                                        onClick={() => selectPeriod('all')}
                                    />
                                </div>

                                <ReportDateRangePicker
                                    align="center"
                                    side="bottom"
                                    className="w-full min-w-0 rounded-md border text-xs font-medium"
                                    endDate={endDate}
                                    isActive={period === 'custom'}
                                    numberOfMonths={2}
                                    startDate={startDate}
                                    statusText={
                                        exportItems.length > 0
                                            ? `${exportItems.length} jadwal ditemukan`
                                            : isPeriodReady
                                              ? 'Tidak ada jadwal'
                                              : undefined
                                    }
                                    onChange={(range) => {
                                        setPeriod('custom');
                                        setStartDate(range.startDate);
                                        setEndDate(range.endDate);

                                        if (!range.isComplete) {
                                            setExportItems([]);
                                        }
                                    }}
                                />
                            </section>

                            <div className="space-y-3">
                                {/* Loading */}
                                {isLoadingItems && (
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map(
                                            (_, index) => (
                                                <div
                                                    key={index}
                                                    className="rounded-[1.25rem] border border-muted/20 bg-background/70 p-4 shadow-sm"
                                                >
                                                    <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted" />
                                                    <div className="mt-3 h-2.5 w-4/5 animate-pulse rounded-full bg-muted/80" />
                                                    <div className="mt-3 h-2.5 w-3/5 animate-pulse rounded-full bg-muted/70" />
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}

                                {/* Error */}
                                {!isLoadingItems && loadError && (
                                    <p className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                                        {loadError}
                                    </p>
                                )}

                                {/* Data */}
                                {!isLoadingItems &&
                                    !loadError &&
                                    exportItems.length > 0 && (
                                        <div className="space-y-3">
                                            {previewItems.map((item) => (
                                                <ScheduleListItem<ScheduleItem>
                                                    key={item.id}
                                                    item={item}
                                                />
                                            ))}

                                            {(hasMoreItems || canShowLess) && (
                                                <div
                                                    className={cn(
                                                        'flex gap-3 pt-3',
                                                        hasMoreItems &&
                                                            canShowLess
                                                            ? 'justify-between'
                                                            : 'justify-center',
                                                    )}
                                                >
                                                    {canShowLess ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 rounded-full border border-muted/30 bg-background px-4 text-sm font-semibold text-muted-foreground shadow-none transition duration-200 hover:bg-muted/10 hover:text-foreground"
                                                            onClick={() => {
                                                                setVisibleCount(
                                                                    (count) =>
                                                                        Math.max(
                                                                            count -
                                                                                PREVIEW_LIMIT,
                                                                            PREVIEW_LIMIT,
                                                                        ),
                                                                );
                                                            }}
                                                        >
                                                            Tampilkan lebih
                                                            sedikit
                                                        </Button>
                                                    ) : null}

                                                    {hasMoreItems ? (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-9 rounded-full border border-muted/30 bg-background px-4 text-sm font-semibold text-muted-foreground shadow-none transition duration-200 hover:bg-muted/10 hover:text-foreground"
                                                            onClick={() => {
                                                                setVisibleCount(
                                                                    (count) =>
                                                                        Math.min(
                                                                            count +
                                                                                PREVIEW_LIMIT,
                                                                            exportItems.length,
                                                                        ),
                                                                );
                                                            }}
                                                        >
                                                            Tampilkan lebih
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                {!isLoadingItems &&
                                    !loadError &&
                                    exportItems.length === 0 &&
                                    !isPeriodReady && (
                                        <div className="rounded-lg border border-dashed p-4 text-center">
                                            <p className="text-sm font-medium">
                                                Lengkapi rentang tanggal
                                            </p>

                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Pilih tanggal mulai dan selesai
                                                untuk melihat isi ekspor.
                                            </p>
                                        </div>
                                    )}

                                {!isLoadingItems &&
                                    !loadError &&
                                    exportItems.length === 0 &&
                                    isPeriodReady && <ScheduleListEmptyState />}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <DrawerFooter className="border-t bg-muted/30 px-5 py-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                disabled={exportDisabled}
                                className="gap-2"
                                onClick={() => void handleExport('excel')}
                            >
                                {exportingFormat === 'excel' ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="size-4" />
                                )}
                                Excel
                            </Button>

                            <Button
                                disabled={exportDisabled}
                                className="gap-2"
                                onClick={() => void handleExport('pdf')}
                            >
                                {exportingFormat === 'pdf' ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <FileText className="size-4" />
                                )}
                                PDF
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </>
    );
}

async function fetchScheduleExportItems(
    requestUrl: string,
): Promise<ScheduleItem[]> {
    const response = await fetch(requestUrl, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Respons data ekspor tidak berhasil.');
    }

    const payload = (await response.json()) as {
        items?: ScheduleItem[];
    };

    if (!Array.isArray(payload.items)) {
        throw new Error('Data ekspor tidak valid.');
    }

    return payload.items;
}

function PeriodButton({
    active,
    label,
    onClick,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            className={cn(
                'inline-flex h-9 flex-1 items-center justify-center rounded-md px-3 text-xs font-medium whitespace-nowrap transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                active
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-muted/10 text-muted-foreground hover:bg-muted/20 hover:text-foreground',
            )}
            onClick={onClick}
        >
            {label}
        </button>
    );
}

type ScheduleExportRow = {
    Acara: string;
    Alamat: string;
    'Daftar Menu dan Jumlah': string;
    Lokasi: string;
    Pelanggan: string;
    Telepon: string;
    Waktu: string;
};

function formatScheduleExportRow(item: ScheduleItem): ScheduleExportRow {
    return {
        Pelanggan: item.customer_name,
        Telepon: item.phone,
        Acara: item.event_name,
        Waktu: item.event_time || 'Belum diisi',
        Alamat: item.address_name || 'Belum diisi',
        Lokasi: formatScheduleGoogleMapsUrl(item.latitude, item.longitude),
        'Daftar Menu dan Jumlah': formatScheduleMenuItems(item.items),
    };
}

type ExcelExportCell = {
    textColor?: string;
    textDecoration?: { underline: true };
    type?: 'Formula';
    value: string;
};

function isGoogleMapsUrl(value: string): boolean {
    return value.startsWith('https://www.google.com/maps/');
}

function excelCellValue(
    header: keyof ScheduleExportRow,
    record: ScheduleExportRow,
): ExcelExportCell {
    if (header === 'Lokasi' && isGoogleMapsUrl(record.Lokasi)) {
        return {
            value: `=HYPERLINK("${record.Lokasi}","Buka Google Maps")`,
            type: 'Formula',
            textColor: '0563C1',
            textDecoration: { underline: true },
        };
    }

    return { value: record[header] };
}

function estimateExcelRowHeight(record: ScheduleExportRow): number {
    const addressLineCount = Math.ceil(record.Alamat.length / 44);
    const menuLineCount = record['Daftar Menu dan Jumlah']
        .split('\n')
        .reduce(
            (lineCount, menuItem) =>
                lineCount + Math.max(1, Math.ceil(menuItem.length / 42)),
            0,
        );
    const lineCount = Math.max(addressLineCount, menuLineCount, 1);

    return Math.min(Math.max(lineCount * 15 + 8, 24), 120);
}

async function exportExcel(records: ScheduleExportRow[]): Promise<void> {
    const headers = Object.keys(records[0] ?? {}) as Array<
        keyof ScheduleExportRow
    >;
    const rows = [
        headers.map((header) => ({
            value: header,
            fontWeight: 'bold' as const,
            backgroundColor: 'F3F4F6',
            align: 'center' as const,
            alignVertical: 'center' as const,
            height: 24,
            wrap: true,
        })),
        ...records.map((record) => {
            const rowHeight = estimateExcelRowHeight(record);

            return headers.map((header) => ({
                ...excelCellValue(header, record),
                verticalAlignment: 'top' as const,
                wrap: true,
                height: rowHeight,
            }));
        }),
    ];
    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    await writeXlsxFile(rows, {
        columns: headers.map((header) => ({
            width:
                header === 'Daftar Menu dan Jumlah'
                    ? 42
                    : header === 'Alamat'
                      ? 44
                      : header === 'Lokasi'
                        ? 22
                        : Math.min(Math.max(header.length + 4, 12), 24),
        })),
        sheet: 'Jadwal',
    }).toFile('jadwal-ekspor.xlsx');
}

async function exportPdf(records: ScheduleExportRow[]): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);
    const headers = Object.keys(records[0] ?? {}) as Array<
        keyof ScheduleExportRow
    >;
    const data = records.map((record) =>
        headers.map((header) => {
            if (header === 'Lokasi' && isGoogleMapsUrl(record.Lokasi)) {
                return 'Buka Google Maps';
            }

            return String(record[header] ?? '');
        }),
    );
    const document = new jsPDF({ orientation: 'landscape' });
    const mapsColumnIndex = headers.indexOf('Lokasi');

    autoTable(document, {
        body: data,
        head: [headers],
        theme: 'grid', // <- ini kunci munculnya border di setiap sel
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            4: { cellWidth: 48 },
            5: { cellWidth: 34 },
            6: { cellWidth: 62 },
        },
        headStyles: {
            fillColor: [241, 245, 249],
            fontStyle: 'bold',
            textColor: [15, 23, 42],
            halign: 'center',
            valign: 'middle',
            lineColor: [148, 163, 184], // border header, abu2 kebiruan
            lineWidth: 0.1,
        },
        styles: {
            cellPadding: 3,
            fontSize: 7,
            overflow: 'linebreak',
            valign: 'top',
            lineColor: [203, 213, 225], // border body, lebih soft
            lineWidth: 0.1,
        },
        didParseCell: (hookData) => {
            if (
                hookData.section === 'body' &&
                hookData.column.index === mapsColumnIndex &&
                isGoogleMapsUrl(records[hookData.row.index]?.Lokasi ?? '')
            ) {
                hookData.cell.styles.textColor = [37, 99, 235];
            }
        },
        didDrawCell: (hookData) => {
            if (
                hookData.section === 'body' &&
                hookData.column.index === mapsColumnIndex
            ) {
                const mapsUrl = records[hookData.row.index]?.Lokasi;

                if (mapsUrl && isGoogleMapsUrl(mapsUrl)) {
                    document.link(
                        hookData.cell.x,
                        hookData.cell.y,
                        hookData.cell.width,
                        hookData.cell.height,
                        { url: mapsUrl },
                    );
                }
            }
        },
        margin: { top: 10, left: 8, right: 8 },
    });

    document.save('jadwal-ekspor.pdf');
}
