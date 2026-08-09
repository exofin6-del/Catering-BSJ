import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import {
    ChevronLeft,
    Download,
    FileSpreadsheet,
    FileText,
    Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SheetData } from 'write-excel-file/browser';

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
import { orderPaymentStatusLabels } from '@/features/orders/utils/order-format';
import { ReportDateRangePicker } from '@/features/reports/components/shared/report-date-range-picker';
import { cn } from '@/lib/utils';
import reportRoute from '@/routes/report';

import type {
    ReportFilters,
    ReportOrder,
    ReportPageProps,
    ReportPeriod,
} from '../types/report-types';
import {
    buildReportQuery,
    formatReportDate,
    formatReportPrice,
} from '../utils/report-utils';

type ReportExportFormat = 'excel' | 'pdf';

type ReportExportDropdownProps = {
    filters: ReportFilters;
};

type ReportExportRow = {
    Pelanggan: string;
    Acara: string;
    'Tanggal&Waktu Acara': string;
    'Tanggal Order': string;
    Total: number;
    Pembayaran: string;
};

const PREVIEW_LIMIT = 4;
const WEEK_OPTIONS = { weekStartsOn: 1 as const };
const PERIOD_OPTIONS: Array<{
    label: string;
    value: Exclude<ReportPeriod, 'custom'>;
}> = [
    { label: 'Hari ini', value: 'daily' },
    { label: 'Bulan ini', value: 'monthly' },
    { label: 'Semua', value: 'all' },
];

export function ReportExportDropdown({ filters }: ReportExportDropdownProps) {
    const initialRange = initialDateRange(filters);
    const [open, setOpen] = useState(false);
    const [period, setPeriod] = useState<ReportPeriod>(filters.period);
    const [startDate, setStartDate] = useState(initialRange.startDate);
    const [endDate, setEndDate] = useState(initialRange.endDate);
    const [reportData, setReportData] = useState<ReportPageProps | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [exportingFormat, setExportingFormat] =
        useState<ReportExportFormat | null>(null);
    const isDateRangeComplete = startDate !== '' && endDate !== '';
    const isPeriodReady = period !== 'custom' || isDateRangeComplete;
    const requestUrl = reportExportUrl(period, startDate, endDate);

    useEffect(() => {
        if (!open || !isPeriodReady) {
            return;
        }

        let isActive = true;

        void Promise.resolve().then(() => {
            if (!isActive) {
                return;
            }

            setIsLoadingData(true);
            setLoadError(null);
        });

        void fetchReportExportData(requestUrl)
            .then((data) => {
                if (isActive) {
                    setReportData(data);
                }
            })
            .catch((error: unknown) => {
                if (!isActive) {
                    return;
                }

                console.error('Gagal memuat data ekspor laporan.', error);
                setReportData(null);
                setLoadError('Data laporan belum dapat dimuat. Coba lagi.');
            })
            .finally(() => {
                if (isActive) {
                    setIsLoadingData(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [isPeriodReady, open, requestUrl]);

    async function handleExport(format: ReportExportFormat): Promise<void> {
        const orders = reportData?.orders.data ?? [];

        if (orders.length === 0) {
            return;
        }

        setExportingFormat(format);

        try {
            const records = orders.map(formatReportExportRow);

            if (format === 'excel') {
                await exportExcel(records, reportData as ReportPageProps);
            } else {
                await exportPdf(records, reportData as ReportPageProps);
            }
        } catch (error) {
            console.error('Gagal mengekspor laporan.', error);
        } finally {
            setExportingFormat(null);
        }
    }

    function selectPeriod(nextPeriod: Exclude<ReportPeriod, 'custom'>) {
        const nextRange = dateRangeForPeriod(nextPeriod);

        setPeriod(nextPeriod);
        setStartDate(nextRange.startDate);
        setEndDate(nextRange.endDate);
        setReportData(null);
        setLoadError(null);
    }

    const isExporting = exportingFormat !== null;
    const orders = reportData?.orders.data ?? [];
    const exportDisabled =
        isExporting || isLoadingData || !isPeriodReady || orders.length === 0;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 px-2.5 sm:px-3"
                onClick={() => {
                    setReportData(null);
                    setLoadError(null);
                    setOpen(true);
                }}
            >
                <Download className="size-4" />
                <span className="sr-only sm:not-sr-only">Ekspor</span>
            </Button>

            <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
                <DrawerContent className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[28rem] max-sm:m-0 max-sm:h-dvh max-sm:max-h-dvh max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 max-sm:[--drawer-inset:0px] sm:w-[28rem]">
                    <DrawerHeader className="border-b p-4 sm:p-5">
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
                                    Ekspor laporan
                                </DrawerTitle>
                                <DrawerDescription className="mt-0.5 text-xs">
                                    Atur periode dan pilih format dokumen.
                                </DrawerDescription>
                            </div>
                        </div>
                    </DrawerHeader>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                        <div className="grid gap-5">
                            <section className="grid gap-4">
                                <div className="grid grid-cols-3 gap-1.5 rounded-md bg-muted/50 p-1 shadow-none">
                                    {PERIOD_OPTIONS.map((option) => (
                                        <PeriodButton
                                            key={option.value}
                                            active={period === option.value}
                                            label={option.label}
                                            onClick={() =>
                                                selectPeriod(option.value)
                                            }
                                        />
                                    ))}
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
                                        isLoadingData
                                            ? 'Menyiapkan...'
                                            : loadError
                                              ? 'Gagal memuat'
                                              : !isPeriodReady
                                                ? 'Pilih rentang tanggal'
                                                : `${orders.length} order ditemukan`
                                    }
                                    onChange={(range) => {
                                        setPeriod('custom');
                                        setStartDate(range.startDate);
                                        setEndDate(range.endDate);

                                        if (!range.isComplete) {
                                            setReportData(null);
                                        }
                                    }}
                                />
                            </section>

                            {isLoadingData ? (
                                <div className="grid gap-2" aria-live="polite">
                                    {Array.from({ length: 3 }).map(
                                        (_, index) => (
                                            <div
                                                key={index}
                                                className="h-[4.75rem] animate-pulse rounded-lg border bg-background/70"
                                            />
                                        ),
                                    )}
                                </div>
                            ) : loadError ? (
                                <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                                    {loadError}
                                </p>
                            ) : reportData ? (
                                <ReportExportPreview data={reportData} />
                            ) : !isPeriodReady ? (
                                <div className="rounded-lg border border-dashed p-4 text-center">
                                    <p className="text-sm font-medium">
                                        Lengkapi rentang tanggal
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Pilih tanggal mulai dan selesai untuk
                                        melihat isi ekspor.
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <DrawerFooter className="border-t bg-muted/30 p-4 sm:p-5">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                type="button"
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
                                type="button"
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

function initialDateRange(filters: ReportFilters): DateRangeState {
    if (filters.period === 'all') {
        return { endDate: '', startDate: '' };
    }

    return {
        endDate: filters.end_date,
        startDate: filters.start_date,
    };
}

type DateRangeState = {
    endDate: string;
    startDate: string;
};

function dateRangeForPeriod(
    period: Exclude<ReportPeriod, 'custom'>,
): DateRangeState {
    const today = new Date();

    if (period === 'all') {
        return { endDate: '', startDate: '' };
    }

    const range = {
        daily: [startOfDay(today), endOfDay(today)],
        monthly: [startOfMonth(today), endOfMonth(today)],
        weekly: [
            startOfWeek(today, WEEK_OPTIONS),
            endOfWeek(today, WEEK_OPTIONS),
        ],
        yearly: [startOfYear(today), endOfYear(today)],
    }[period];

    return {
        endDate: format(range[1], 'yyyy-MM-dd'),
        startDate: format(range[0], 'yyyy-MM-dd'),
    };
}

function reportExportUrl(
    period: ReportPeriod,
    startDate: string,
    endDate: string,
): string {
    return reportRoute.export.url({
        query: buildReportQuery({
            end_date: period === 'custom' ? endDate : undefined,
            period,
            start_date: period === 'custom' ? startDate : undefined,
        }),
    });
}

async function fetchReportExportData(
    requestUrl: string,
): Promise<ReportPageProps> {
    const response = await fetch(requestUrl, {
        headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Respons data ekspor tidak berhasil.');
    }

    const payload = (await response.json()) as ReportPageProps;

    if (!payload.orders || !Array.isArray(payload.orders.data)) {
        throw new Error('Data ekspor tidak valid.');
    }

    return payload;
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
                'inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium whitespace-nowrap transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
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

function ReportExportPreview({ data }: { data: ReportPageProps }) {
    const [visibleCount, setVisibleCount] = useState(PREVIEW_LIMIT);
    const orders = data.orders.data;
    const previewOrders = orders.slice(0, visibleCount);
    const hasMoreOrders = visibleCount < orders.length;
    const canShowLess = visibleCount > PREVIEW_LIMIT;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground">
                        Total Order
                    </p>
                    <p className="mt-1 text-base font-bold tabular-nums">
                        {data.summary.order_count.toLocaleString('id-ID')}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center rounded-lg border bg-muted/30 p-3 text-center">
                    <p className="text-[11px] text-muted-foreground">
                        Total Pendapatan
                    </p>
                    <p className="mt-1 text-base font-bold tabular-nums">
                        {formatReportPrice(data.summary.total_revenue)}
                    </p>
                </div>
            </div>

            <div className="grid gap-2">
                {previewOrders.map((order) => (
                    <ReportExportOrderItem key={order.id} order={order} />
                ))}
            </div>

            {(hasMoreOrders || canShowLess) && (
                <div
                    className={cn(
                        'flex gap-3 pt-3',
                        hasMoreOrders && canShowLess
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
                                setVisibleCount((count) =>
                                    Math.max(
                                        count - PREVIEW_LIMIT,
                                        PREVIEW_LIMIT,
                                    ),
                                );
                            }}
                        >
                            Tampilkan lebih sedikit
                        </Button>
                    ) : null}

                    {hasMoreOrders ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-9 rounded-full border border-muted/30 bg-background px-4 text-sm font-semibold text-muted-foreground shadow-none transition duration-200 hover:bg-muted/10 hover:text-foreground"
                            onClick={() => {
                                setVisibleCount((count) =>
                                    Math.min(
                                        count + PREVIEW_LIMIT,
                                        orders.length,
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
    );
}

function ReportExportOrderItem({ order }: { order: ReportOrder }) {
    return (
        <div className="grid gap-1 rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold">
                    {order.order_code}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatReportPrice(order.total_price)}
                </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="truncate">{order.customer_name}</span>

                <div className="shrink-0 text-right">
                    <span className="mr-1">Tanggal Acara</span>
                    <span>{formatReportDate(order.event_date)}</span>
                </div>
            </div>
        </div>
    );
}

function formatReportExportRow(order: ReportOrder): ReportExportRow {
    return {
        'Tanggal Order': formatReportDate(order.created_at),
        Pelanggan: order.customer_name,
        Acara: order.event_name,
        'Tanggal&Waktu Acara': `${formatReportDate(order.event_date)} • ${order.event_time ?? '-'}`,
        Total: order.total_price,
        Pembayaran: orderPaymentStatusLabels[order.payment_status],
    };
}

async function exportExcel(
    records: ReportExportRow[],
    data: ReportPageProps,
): Promise<void> {
    const headers = Object.keys(records[0] ?? {}) as Array<
        keyof ReportExportRow
    >;

    const period =
        data.filters.period === 'all'
            ? 'Semua Waktu'
            : `${formatReportDate(data.filters.start_date)} - ${formatReportDate(data.filters.end_date)}`;

    const rows: SheetData = [
        // --- Judul & Periode ---
        [
            { value: 'Laporan Catering BSJ', fontSize: 16, fontWeight: 'bold' },
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            { value: period, fontWeight: 'bold', align: 'right' },
        ],

        [],

        // --- Header Tabel ---
        headers.map((header) => ({
            value: header,
            align: 'center',
            backgroundColor: 'F3F4F6',
            fontWeight: 'bold',
            height: 24,
            alignVertical: 'center',
            wrap: true,
        })),

        // --- Isi Data ---
        ...records.map((record) =>
            headers.map((header) => ({
                value: record[header],
                align: (header === 'Acara' ? 'left' : 'center') as
                    | 'left'
                    | 'center',
                height: 24,
                alignVertical: 'center' as const,
                wrap: true,
            })),
        ),

        [],

        // --- Ringkasan Footer ---
        [
            { value: `Total Order: ${data.summary.order_count}` },
            {},
            {},
            {},
            {},
            {},
            {},
            {},
            {
                value: `Total Pendapatan: ${formatReportPrice(data.summary.total_revenue)}`,
                align: 'right',
            },
        ],
    ];

    const { default: writeXlsxFile } = await import('write-excel-file/browser');

    await writeXlsxFile(rows, {
        columns: headers.map((header) => ({
            width: ['Acara', 'Pelanggan'].includes(header)
                ? 28
                : ['Total', 'Dibayar', 'Sisa'].includes(header)
                  ? 16
                  : Math.min(Math.max(header.length + 4, 14), 22),
        })),
        sheet: 'Laporan',
    }).toFile('laporan-ekspor.xlsx');
}

async function exportPdf(
    records: ReportExportRow[],
    data: ReportPageProps,
): Promise<void> {
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);

    const headers = Object.keys(records[0] ?? {}) as Array<
        keyof ReportExportRow
    >;

    const tableData = records.map((record) =>
        headers.map((header) => {
            if (['Total', 'Dibayar', 'Sisa'].includes(header)) {
                return formatReportPrice(record[header] as number);
            }

            return String(record[header] ?? '');
        }),
    );

    const document = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    const pageWidth = document.internal.pageSize.getWidth();

    const period =
        data.filters.period === 'all'
            ? 'Semua Waktu'
            : `${formatReportDate(data.filters.start_date)} - ${formatReportDate(data.filters.end_date)}`;

    // ------------------------------------------------------------------
    // Header Dokumen
    // ------------------------------------------------------------------

    // Judul
    document.setFont('helvetica', 'bold');
    document.setFontSize(14);
    document.setTextColor(15, 23, 42); // Slate 900
    document.text('Laporan Catering BSJ', 10, 15);

    // Periode (rata kanan)
    document.setFont('helvetica', 'normal');
    document.setFontSize(9);
    document.setTextColor(100, 116, 139); // Slate 500
    document.text(`Periode: ${period}`, pageWidth - 10, 15, { align: 'right' });

    // ------------------------------------------------------------------
    // Baris Ringkasan (Total Order & Total Pendapatan) sebagai baris tabel
    // ------------------------------------------------------------------

    const leftSpan = Math.ceil(headers.length / 2);
    const rightSpan = headers.length - leftSpan;

    const footRow = [
        {
            content: `Total Order: ${data.summary.order_count}`,
            colSpan: leftSpan,
            styles: { halign: 'left' as const, fontStyle: 'bold' as const },
        },
        {
            content: `Total Pendapatan: ${formatReportPrice(data.summary.total_revenue)}`,
            colSpan: rightSpan,
            styles: { halign: 'right' as const, fontStyle: 'bold' as const },
        },
    ];

    // ------------------------------------------------------------------
    // Tabel Utama
    // ------------------------------------------------------------------

    autoTable(document, {
        head: [headers],
        body: tableData,
        foot: [footRow],
        startY: 23,
        margin: { left: 10, right: 10 },
        theme: 'plain', // plain agar border bisa di-custom lebih rapi
        styles: {
            font: 'helvetica',
            fontSize: 8.5, // dinaikkan agar jelas & profesional
            cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
            overflow: 'linebreak',
            valign: 'middle',
            halign: 'center', // semua isi tabel rata tengah
            textColor: [51, 65, 85], // Slate 700
            fillColor: [255, 255, 255], // putih, tanpa zebra warna
            lineColor: [226, 232, 240], // Slate 200, hanya untuk garis horizontal
            lineWidth: { top: 0.1, bottom: 0.1, left: 0, right: 0 }, // tanpa garis vertikal
        },
        headStyles: {
            fillColor: [255, 255, 255], // putih
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            textColor: [15, 23, 42], // Slate 900
            lineWidth: { top: 0.2, bottom: 0.2, left: 0, right: 0 },
            lineColor: [203, 213, 225], // Slate 300
        },
        footStyles: {
            fillColor: [255, 255, 255], // putih
            fontSize: 9,
            textColor: [15, 23, 42], // Slate 900
            lineWidth: { top: 0.2, bottom: 0, left: 0, right: 0 },
            lineColor: [203, 213, 225], // Slate 300
        },

        // Kolom  rata kiri
        didParseCell: (cellData) => {
            const header = headers[cellData.column.index];

            if (['Acara', 'Pelanggan', 'Tanggal Order'].includes(header)) {
                cellData.cell.styles.halign = 'left';
            }
        },
    });

    document.save('laporan-ekspor.pdf');
}
