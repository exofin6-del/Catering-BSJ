import { Head, router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import {
    Calendar,
    Download,
    TrendingUp,
    Utensils,
    Package as PackageIcon,
    Percent,
    CheckCircle2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';

import { DataTable, DataTableExportButton } from '@/components/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes';
import reportRoute from '@/routes/report';
import type { BreadcrumbItem } from '@/types';

// Format currency to IDR
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Format standard number
const formatNumber = (value: number) => {
    return new Intl.NumberFormat('id-ID').format(value);
};

interface OrderRow {
    created_at: string;
    customer_name: string;
    event_date: string;
    event_name: string;
    id: number;
    items_count: number;
    latest_payment_at: string | null;
    order_code: string;
    paid_amount: number;
    payment_status: string;
    remaining_amount: number;
    status: string;
    event_time: string | null;
    total_price: number;
}

interface ReportSalesProps {
    filters: {
        end_date: string;
        period: string;
        start_date: string;
    };
    orders: {
        data: OrderRow[];
        total_orders: number;
    };
    summary: {
        average_order_value: number;
        highest_order_date: string | null;
        highest_order_value: number;
        order_count: number;
        total_paid: number;
        total_receivable: number;
        total_revenue: number;
    };
    status_breakdown: Record<string, { count: number; total_amount: number }>;
    payment_breakdown: Array<{
        method: string;
        count: number;
        total_amount: number;
    }>;
    popular_menu_items: Array<{
        id: number | null;
        name: string;
        qty: number;
        revenue: number;
    }>;
    popular_packages: Array<{
        id: number | null;
        name: string;
        qty: number;
        revenue: number;
    }>;
    recent_payments: Array<{
        id: number;
        order_code: string;
        customer_name: string;
        type: string;
        method: string | null;
        amount: number;
        paid_at: string | null;
    }>;
}

export default function ReportSalesPage({
    filters,
    orders,
    summary,
    popular_menu_items,
    popular_packages,
}: ReportSalesProps) {
    const [period, setPeriod] = useState(filters.period || 'monthly');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Handle filter submit
    const handleApplyFilters = () => {
        router.visit(reportRoute.sales().url, {
            data: {
                period,
                start_date: period === 'custom' ? startDate : undefined,
                end_date: period === 'custom' ? endDate : undefined,
            },
            preserveState: true,
        });
    };

    const handlePeriodChange = (val: string) => {
        setPeriod(val);

        if (val !== 'custom') {
            router.visit(reportRoute.sales().url, {
                data: { period: val },
                preserveState: true,
            });
        }
    };

    // Columns for order list DataTable
    const columns: ColumnDef<OrderRow>[] = [
        {
            accessorKey: 'order_code',
            header: 'Kode Order',
            cell: ({ row }) => (
                <span className="font-mono font-medium text-foreground">
                    {row.original.order_code}
                </span>
            ),
        },
        {
            accessorKey: 'customer_name',
            header: 'Pelanggan',
            cell: ({ row }) => (
                <span className="font-medium text-foreground">
                    {row.original.customer_name}
                </span>
            ),
        },
        {
            accessorKey: 'event_name',
            header: 'Acara',
            cell: ({ row }) => (
                <span className="line-clamp-1 text-muted-foreground">
                    {row.original.event_name}
                </span>
            ),
        },
        {
            accessorKey: 'event_date',
            header: 'Tanggal Acara',
            cell: ({ row }) => {
                const date = row.original.event_date;

                return date
                    ? new Date(date).toLocaleDateString('id-ID', {
                          dateStyle: 'medium',
                      })
                    : '-';
            },
        },
        {
            accessorKey: 'total_price',
            header: 'Total Omset',
            cell: ({ row }) => (
                <span className="font-medium">
                    {formatCurrency(row.original.total_price)}
                </span>
            ),
        },
    ];

    // Trigger full CSV export download from backend
    const triggerBackendExport = () => {
        window.location.href = reportRoute.export.url({
            query: {
                period,
                ...(period === 'custom' && startDate
                    ? { start_date: startDate }
                    : {}),
                ...(period === 'custom' && endDate
                    ? { end_date: endDate }
                    : {}),
            },
        });
    };

    // Mix menu and package data for visual breakdown comparison
    const topItemsData = useMemo(() => {
        const menus = popular_menu_items.map((item) => ({
            name: item.name,
            omset: item.revenue,
            porsi: item.qty,
            type: 'Menu',
        }));
        const packages = popular_packages.map((item) => ({
            name: item.name,
            omset: item.revenue,
            porsi: item.qty,
            type: 'Paket',
        }));

        return [...menus, ...packages].slice(0, 6);
    }, [popular_menu_items, popular_packages]);

    return (
        <>
            <Head title="Laporan Analisis Penjualan" />

            <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6">
                {/* Header Toolbar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Analisis Penjualan & Produk
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Laporan mendalam performa menu, omset penjualan, dan
                            item terlaris.
                        </p>
                    </div>
                    <Button
                        onClick={triggerBackendExport}
                        className="flex items-center gap-2 self-start bg-primary font-medium text-primary-foreground shadow-md hover:bg-primary/95 sm:self-auto"
                    >
                        <Download className="size-4" />
                        Ekspor CSV Lengkap
                    </Button>
                </div>

                {/* Filters Section */}
                <Card className="border border-border/40 bg-card/60 shadow-sm backdrop-blur-sm">
                    <CardHeader className="py-4">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Calendar className="size-4 text-muted-foreground" />
                            Filter Rentang Analisis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 items-end gap-4 pb-4 sm:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="period-select"
                                className="text-xs font-medium"
                            >
                                Periode
                            </Label>
                            <Select
                                value={period}
                                onValueChange={handlePeriodChange}
                            >
                                <SelectTrigger id="period-select">
                                    <SelectValue placeholder="Pilih Periode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua Waktu
                                    </SelectItem>
                                    <SelectItem value="daily">
                                        Hari Ini
                                    </SelectItem>
                                    <SelectItem value="weekly">
                                        Minggu Ini
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        Bulan Ini
                                    </SelectItem>
                                    <SelectItem value="yearly">
                                        Tahun Ini
                                    </SelectItem>
                                    <SelectItem value="custom">
                                        Kustom Tanggal
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {period === 'custom' && (
                            <>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="start-date"
                                        className="text-xs font-medium"
                                    >
                                        Tanggal Mulai
                                    </Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="end-date"
                                        className="text-xs font-medium"
                                    >
                                        Tanggal Selesai
                                    </Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                    />
                                </div>
                                <Button
                                    onClick={handleApplyFilters}
                                    className="w-full sm:w-auto"
                                >
                                    Terapkan
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Metrics Summary Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Omset */}
                    <Card className="border border-border/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Omset Penjualan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(summary.total_revenue)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <TrendingUp className="size-3.5 shrink-0 text-emerald-500" />
                                <span>Total nilai order tercatat</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Terjual */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Total Order Selesai
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {formatNumber(summary.order_count)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                                <span>Transaksi sukses</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rata-Rata Order */}
                    <Card className="border border-border/40 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                Rata-Rata Keranjang
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {formatCurrency(summary.average_order_value)}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Percent className="size-3.5 shrink-0 text-muted-foreground" />
                                <span>Rata-rata belanja order</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Omset Bar Chart */}
                <Card className="border border-border/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base font-bold">
                            Perbandingan Omset Item Terpopuler
                        </CardTitle>
                        <CardDescription>
                            Visualisasi omset gabungan dari menu dan paket
                            catering terlaris.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] w-full pt-4">
                        {topItemsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topItemsData}
                                    margin={{
                                        top: 20,
                                        right: 30,
                                        left: 20,
                                        bottom: 5,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="rgba(226, 232, 240, 0.1)"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        style={{
                                            fontSize: '11px',
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) =>
                                            `Rp ${value / 1000000}M`
                                        }
                                        style={{
                                            fontSize: '11px',
                                            fill: 'hsl(var(--muted-foreground))',
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value) =>
                                            formatCurrency(value as number)
                                        }
                                        contentStyle={{
                                            backgroundColor:
                                                'hsl(var(--background))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="omset"
                                        name="Total Omset"
                                        fill="var(--color-primary, #10b981)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground italic">
                                Belum ada data item untuk perbandingan.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Popular details lists */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Top Menus */}
                    <Card className="border border-border/40 bg-card/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <Utensils className="size-4.5 text-primary" />
                                Rincian Porsi Menu Terlaris
                            </CardTitle>
                            <CardDescription>
                                Menu yang paling banyak dikonsumsi oleh
                                pelanggan.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {popular_menu_items.length > 0 ? (
                                popular_menu_items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border border-border/10 bg-secondary/30 p-3"
                                    >
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="truncate text-sm font-semibold">
                                                {item.name}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge className="border-transparent bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-400">
                                                    Menu
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.qty} porsi terjual
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold">
                                                {formatCurrency(item.revenue)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground italic">
                                    Belum ada data menu.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Packages */}
                    <Card className="border border-border/40 bg-card/40 shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-bold">
                                <PackageIcon className="size-4.5 text-primary" />
                                Rincian Pemesanan Paket Terlaris
                            </CardTitle>
                            <CardDescription>
                                Paket menu catering dengan volume pesanan
                                tertinggi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {popular_packages.length > 0 ? (
                                popular_packages.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between rounded-lg border border-border/10 bg-secondary/30 p-3"
                                    >
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="truncate text-sm font-semibold">
                                                {item.name}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge className="border-transparent bg-sky-500/10 text-[10px] text-sky-700 dark:text-sky-400">
                                                    Paket
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {item.qty} pesanan
                                                </span>
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-bold">
                                                {formatCurrency(item.revenue)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-4 text-center text-sm text-muted-foreground italic">
                                    Belum ada data paket.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sales Table list */}
                <Card className="border border-border/40 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                        <div className="min-w-0">
                            <CardTitle className="text-md truncate font-semibold tracking-normal">
                                Daftar Omset Order
                            </CardTitle>
                            <CardDescription className="truncate text-xs text-muted-foreground">
                                Transaksi selesai pendongkrak omset penjualan.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            data={orders.data}
                            columns={columns}
                            emptyTitle="Tidak ada data penjualan"
                            emptyDescription="Belum ada transaksi omset untuk periode terfilter."
                            getRowId={(row) => String(row.id)}
                            pageSize={10}
                            pageSizeOptions={[10, 25, 50]}
                            renderToolbar={(table, context) => (
                                <div className="flex items-center justify-between pb-4">
                                    <div className="text-xs text-muted-foreground">
                                        Total data:{' '}
                                        <strong>{orders.data.length}</strong>{' '}
                                        baris
                                    </div>
                                    <DataTableExportButton
                                        table={table}
                                        filename={`laporan_penjualan_${filters.start_date}_ke_${filters.end_date}`}
                                        formatRow={(row) => ({
                                            Kode: row.order_code,
                                            Pelanggan: row.customer_name,
                                            Acara: row.event_name,
                                            Tanggal: row.event_date,
                                            Omset: row.total_price,
                                        })}
                                        isExportSelectionMode={
                                            context.isExportSelectionMode
                                        }
                                        onExportSelectionModeChange={
                                            context.setIsExportSelectionMode
                                        }
                                        selectedRowCount={
                                            context.selectedRowCount
                                        }
                                    />
                                </div>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ReportSalesPage.layout = {
    title: 'Analisis Penjualan',
    description: 'Statistik dan performa penjualan produk catering terlaris.',
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Laporan',
            href: reportRoute.index().url,
        },
        {
            title: 'Analisis Penjualan',
            href: reportRoute.sales().url,
        },
    ] as BreadcrumbItem[],
};
