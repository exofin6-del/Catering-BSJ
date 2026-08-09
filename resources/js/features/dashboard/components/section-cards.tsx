import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    Banknote,
    CalendarClock,
    CheckCircle2,
    ClipboardList,
    CreditCard,
    Package as PackageIcon,
    Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import type {
    DashboardDailyLoad,
    DashboardOrderTraffic,
    DashboardStats,
} from '../types/dashboard-types';
import {
    formatDashboardCurrency,
    formatDashboardNumber,
    parseDashboardDecimal,
} from '../utils/dashboard-format';

type SectionCardsProps = {
    dailyLoads: DashboardDailyLoad[];
    orderTraffic: DashboardOrderTraffic[];
    stats: DashboardStats;
};

type KpiTone = 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';

const toneConfig: Record<
    KpiTone,
    {
        icon: string;
        accent: string;
        badge: string;
    }
> = {
    amber: {
        icon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
        accent: 'text-amber-600 dark:text-amber-400',
        badge: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
    },
    emerald: {
        icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
        accent: 'text-emerald-600 dark:text-emerald-400',
        badge: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300',
    },
    rose: {
        icon: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
        accent: 'text-rose-600 dark:text-rose-400',
        badge: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
    },
    sky: {
        icon: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
        accent: 'text-sky-600 dark:text-sky-400',
        badge: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
    },
    violet: {
        icon: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
        accent: 'text-violet-600 dark:text-violet-400',
        badge: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
    },
};

type RevenuePeriod = '7d' | '30d' | 'month';

export function SectionCards({ orderTraffic, stats }: SectionCardsProps) {
    const orderSeries = React.useMemo(
        () => orderTraffic.map((item) => item.orders),
        [orderTraffic],
    );

    return (
        <div className="flex flex-col gap-5">
            {/* Revenue Hero + Primary KPIs */}
            <div className="grid grid-cols-1 gap-4 @3xl/main:grid-cols-3">
                <div className="@3xl/main:col-span-2">
                    <RevenueHeroCard orderTraffic={orderTraffic} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 @3xl/main:grid-cols-1">
                    <KpiCard
                        label="Tagihan Tertunda"
                        value={formatDashboardCurrency(
                            stats.outstanding_balance,
                        )}
                        description="Sisa pembayaran yang belum lunas"
                        icon={CreditCard}
                        tone={stats.need_payment > 0 ? 'amber' : 'emerald'}
                        visualType="outstanding"
                        needPaymentCount={stats.need_payment}
                    />
                    <KpiCard
                        label="Order Hari Ini"
                        value={formatDashboardNumber(stats.today_orders)}
                        description="Event yang dijadwalkan hari ini"
                        icon={CalendarClock}
                        tone="sky"
                        visualType="bars"
                        visualValues={orderSeries}
                        barCaption="7 hari terakhir"
                    />
                </div>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 gap-4 @5xl/main:grid-cols-4">
                <KpiCard
                    label="Menunggu ACC"
                    value={formatDashboardNumber(stats.pending_confirmation)}
                    description="Order baru menunggu konfirmasi"
                    icon={ClipboardList}
                    tone={stats.pending_confirmation > 0 ? 'rose' : 'emerald'}
                    visualType="pending"
                    pendingCount={stats.pending_confirmation}
                />
                <KpiCard
                    label="Selesai Bulan Ini"
                    value={formatDashboardNumber(stats.completed_this_month)}
                    description="Order yang sudah selesai"
                    icon={CheckCircle2}
                    tone="emerald"
                    visualType="progress"
                    completed={stats.completed_this_month}
                    total={stats.total_orders}
                />
                <KpiCard
                    label="Menu Aktif"
                    value={formatDashboardNumber(stats.active_menu_items)}
                    description="Menu tersedia di katalog"
                    icon={Utensils}
                    tone="sky"
                    visualType="simple"
                />
                <KpiCard
                    label="Paket Aktif"
                    value={formatDashboardNumber(stats.active_packages)}
                    description="Paket tersedia di katalog"
                    icon={PackageIcon}
                    tone="amber"
                    visualType="simple"
                />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Revenue Hero Card                                                          */
/* -------------------------------------------------------------------------- */

function RevenueHeroCard({
    orderTraffic,
}: {
    orderTraffic: DashboardOrderTraffic[];
}) {
    const [period, setPeriod] = React.useState<RevenuePeriod>('7d');

    const chartData = React.useMemo(() => {
        const filtered = filterByPeriod(orderTraffic, period);

        return filtered.map((item) => ({
            label: formatShortDate(item.date),
            revenue: parseDashboardDecimal(item.revenue),
        }));
    }, [orderTraffic, period]);

    const total = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const average = chartData.length > 0 ? total / chartData.length : 0;

    return (
        <Card className="h-full overflow-hidden border-emerald-500/15 bg-gradient-to-br from-emerald-50/50 via-card to-card dark:from-emerald-500/[0.03]">
            <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <Banknote className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Revenue
                                </p>
                                <p className="text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl dark:text-emerald-300">
                                    {formatDashboardCurrency(total)}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {chartData.length > 0
                                ? `Rata-rata ${formatDashboardCurrency(average)} / hari · ${chartData.length} hari terakhir`
                                : 'Belum ada data untuk periode ini'}
                        </p>
                    </div>

                    <Tabs
                        value={period}
                        onValueChange={(value) =>
                            setPeriod(value as RevenuePeriod)
                        }
                    >
                        <TabsList className="h-8">
                            <TabsTrigger value="7d" className="px-3 text-xs">
                                7H
                            </TabsTrigger>
                            <TabsTrigger value="30d" className="px-3 text-xs">
                                30H
                            </TabsTrigger>
                            <TabsTrigger value="month" className="px-3 text-xs">
                                Bulan Ini
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="mt-5 h-44 w-full sm:h-52">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={0}
                        >
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 8,
                                    right: 4,
                                    left: -16,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="revenueFill"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#10b981"
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#10b981"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    className="stroke-border/40"
                                />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={24}
                                />
                                <YAxis
                                    tickFormatter={formatCompactCurrency}
                                    tick={{ fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={56}
                                />
                                <Tooltip
                                    formatter={(value: any) => [
                                        formatDashboardCurrency(
                                            (value ?? 0) as number,
                                        ),
                                        'Revenue',
                                    ]}
                                    contentStyle={{
                                        fontSize: 12,
                                        borderRadius: 10,
                                        border: '1px solid hsl(var(--border))',
                                        boxShadow:
                                            '0 4px 12px rgb(0 0 0 / 0.08)',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#revenueFill)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Belum ada data revenue
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function filterByPeriod(
    orderTraffic: DashboardOrderTraffic[],
    period: RevenuePeriod,
): DashboardOrderTraffic[] {
    if (period === '7d') {
        return orderTraffic.slice(-7);
    }

    if (period === '30d') {
        return orderTraffic.slice(-30);
    }

    const now = new Date();

    return orderTraffic.filter((item) => {
        const itemDate = new Date(item.date);

        return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth()
        );
    });
}

function formatShortDate(dateStr: string): string {
    try {
        return format(new Date(dateStr), 'd MMM', { locale: id });
    } catch {
        return dateStr;
    }
}

function formatCompactCurrency(value: number): string {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}jt`;
    }

    if (value >= 1_000) {
        return `${Math.round(value / 1_000)}rb`;
    }

    return `${value}`;
}

/* -------------------------------------------------------------------------- */
/* KPI Card                                                                   */
/* -------------------------------------------------------------------------- */

type KpiCardProps = {
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
    tone: KpiTone;
    visualType: 'bars' | 'outstanding' | 'pending' | 'progress' | 'simple';
    visualValues?: number[];
    barCaption?: string;
    needPaymentCount?: number;
    pendingCount?: number;
    completed?: number;
    total?: number;
};

function KpiCard({
    label,
    value,
    description,
    icon: Icon,
    tone,
    visualType,
    visualValues,
    barCaption,
    needPaymentCount = 0,
    pendingCount = 0,
    completed = 0,
    total = 0,
}: KpiCardProps) {
    const config = toneConfig[tone];

    return (
        <Card className="relative h-full overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            {label}
                        </p>
                        <p className="text-xl font-bold tracking-tight tabular-nums sm:text-2xl">
                            {value}
                        </p>
                    </div>
                    <span
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-xl',
                            config.icon,
                        )}
                    >
                        <Icon className="size-5" />
                    </span>
                </div>

                {/* Description */}
                <p className="mt-1 text-xs text-muted-foreground/80">
                    {description}
                </p>

                {/* Visual */}
                <div className="mt-3">
                    {visualType === 'bars' && visualValues && (
                        <MiniBars
                            tone={tone}
                            values={visualValues}
                            caption={barCaption}
                        />
                    )}

                    {visualType === 'outstanding' && (
                        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                            <span className="font-medium text-muted-foreground">
                                {needPaymentCount > 0
                                    ? `${needPaymentCount} order belum lunas`
                                    : 'Semua order sudah lunas'}
                            </span>
                            {needPaymentCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        'rounded-full px-2 py-0 text-[10px]',
                                        config.badge,
                                    )}
                                >
                                    Perlu Tindakan
                                </Badge>
                            )}
                        </div>
                    )}

                    {visualType === 'pending' && (
                        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                            <span
                                className={cn(
                                    'font-medium',
                                    pendingCount > 0
                                        ? 'font-semibold text-rose-600 dark:text-rose-400'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {pendingCount > 0
                                    ? `${pendingCount} order butuh ACC`
                                    : 'Tidak ada antrean'}
                            </span>
                            {pendingCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="rounded-full border-rose-200 bg-rose-50 px-2 py-0 text-[10px] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                                >
                                    Segera ACC
                                </Badge>
                            )}
                        </div>
                    )}

                    {visualType === 'progress' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                                <span>Progress</span>
                                <span className="tabular-nums">
                                    {completed}/{total}{' '}
                                    <span className="text-muted-foreground/60">
                                        (
                                        {total > 0
                                            ? Math.round(
                                                  (completed / total) * 100,
                                              )
                                            : 0}
                                        %)
                                    </span>
                                </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700 ease-out"
                                    style={{
                                        width: `${total > 0 ? Math.min(100, (completed / total) * 100) : 0}%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {visualType === 'simple' && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            <span>Aktif di sistem</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/* Mini Bars                                                                  */
/* -------------------------------------------------------------------------- */

function MiniBars({
    tone,
    values,
    caption,
}: {
    tone: KpiTone;
    values: number[];
    caption?: string;
}) {
    const normalizedValues = values.slice(-10);
    const maxValue = Math.max(...normalizedValues, 1);

    const barColors: Record<KpiTone, string> = {
        amber: 'bg-amber-400 dark:bg-amber-500',
        emerald: 'bg-emerald-400 dark:bg-emerald-500',
        rose: 'bg-rose-400 dark:bg-rose-500',
        sky: 'bg-sky-400 dark:bg-sky-500',
        violet: 'bg-violet-400 dark:bg-violet-500',
    };

    return (
        <div className="space-y-1.5">
            {caption && (
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground/70 uppercase">
                    {caption}
                </span>
            )}
            <div className="flex h-8 items-end gap-1" aria-hidden="true">
                {normalizedValues.map((value, index) => {
                    const height =
                        value > 0 ? Math.max(16, (value / maxValue) * 100) : 10;

                    return (
                        <span
                            key={`${value}-${index}`}
                            className={cn(
                                'min-w-0 flex-1 rounded-sm opacity-80 transition-all duration-300 hover:opacity-100',
                                barColors[tone],
                            )}
                            style={{ height: `${height}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
