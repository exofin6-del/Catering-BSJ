'use client';

import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export type MixedBarChartDataItem = {
    color?: string;
    id: string;
    label: string;
    rank?: number | string;
    value: number;
};

export type MixedBarChartDisplayValue = string | number;

export type MixedBarChartValueFormatter = (
    value: number,
    item?: MixedBarChartDataItem,
) => MixedBarChartDisplayValue;

type BarChartMixedProps = {
    barSize?: number;
    chartClassName?: string;
    chartHeight?: number;
    className?: string;
    config?: ChartConfig;
    contentClassName?: string;
    data: MixedBarChartDataItem[];
    emptyLabel?: string;
    headerAction?: React.ReactNode;
    icon?: LucideIcon;
    labelColor?: string;
    maxLabelLength?: number;
    rowHeight?: number;
    showRank?: boolean;
    title?: string;
    valueFormatter?: MixedBarChartValueFormatter;
    valueSuffix?: string;
};

type RankedMixedBarChartDataItem = MixedBarChartDataItem & {
    fill: string;
    rank: number | string;
};

const BASE_COLOR = 'var(--chart-1)';
const DEFAULT_MAX_LABEL_LENGTH = 24;
const DEFAULT_CHART_HEIGHT = 140;
const DEFAULT_ROW_HEIGHT = 40;
const LABEL_CHARACTER_WIDTH = 6.5;
const LABEL_HORIZONTAL_PADDING = 10;
const LABEL_MIN_LENGTH = 4;
const LABEL_FONT_SIZE = 14;
const RANK_LABEL_FONT_SIZE = 12;
const VALUE_LABEL_FONT_SIZE = 14;
const BAR_TRACK_OPACITY = 0.42;

type MixedBarChartLabelViewBox = {
    height: number;
    width: number;
    x: number;
    y: number;
};

type MixedBarChartLabelProps = {
    maxLength: number;
    value?: unknown;
    viewBox?: unknown;
};

type MixedBarChartRankLabelProps = {
    value?: unknown;
    viewBox?: unknown;
};

type MixedBarChartValueLabelProps = {
    formatter: MixedBarChartValueFormatter;
    parentViewBox?: unknown;
    value?: unknown;
    viewBox?: unknown;
};

export const neutralMixedBarChartPalette = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
] as const;

export function formatMixedBarChartValue(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}

export function formatMixedBarChartTick(
    value: unknown,
    maxLength = DEFAULT_MAX_LABEL_LENGTH,
): string {
    const label = String(value ?? '');
    const normalizedMaxLength = Math.max(1, Math.floor(maxLength));

    return label.length <= normalizedMaxLength
        ? label
        : `${label.slice(0, normalizedMaxLength - 1)}…`;
}

function formatMixedBarChartLabel(
    value: unknown,
    availableWidth: number,
    maxLength: number,
): string {
    const widthLimitedLength = Math.max(
        LABEL_MIN_LENGTH,
        Math.floor(availableWidth / LABEL_CHARACTER_WIDTH),
    );

    return formatMixedBarChartTick(
        value,
        Math.min(maxLength, widthLimitedLength),
    );
}

function getMixedBarChartLabelViewBox(
    viewBox: unknown,
): MixedBarChartLabelViewBox | undefined {
    if (!viewBox || typeof viewBox !== 'object') {
        return;
    }

    const { height, width, x, y } = viewBox as Record<string, unknown>;

    if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof width !== 'number' ||
        typeof height !== 'number'
    ) {
        return;
    }

    return { height, width, x, y };
}

function MixedBarChartLabel({
    maxLength,
    value,
    viewBox,
}: MixedBarChartLabelProps) {
    const labelViewBox = getMixedBarChartLabelViewBox(viewBox);

    if (!labelViewBox) {
        return null;
    }

    const { height, width, x, y } = labelViewBox;
    const fullLabel = String(value ?? '');
    const availableWidth = Math.max(0, width - LABEL_HORIZONTAL_PADDING * 2);
    const label = formatMixedBarChartLabel(
        fullLabel,
        availableWidth,
        maxLength,
    );

    return (
        <text
            x={x + LABEL_HORIZONTAL_PADDING}
            y={y + height / 2}
            textAnchor="start"
            dominantBaseline="central"
            className="fill-(--color-label) font-medium"
            fontSize={LABEL_FONT_SIZE}
            pointerEvents="none"
            style={{ whiteSpace: 'pre' }}
        >
            <title>{fullLabel}</title>
            {label}
        </text>
    );
}

function MixedBarChartRankLabel({
    value,
    viewBox,
}: MixedBarChartRankLabelProps) {
    const labelViewBox = getMixedBarChartLabelViewBox(viewBox);
    const label = formatRankLabel(value);

    if (!labelViewBox || !label) {
        return null;
    }

    const { height, x, y } = labelViewBox;

    return (
        <text
            x={x - LABEL_HORIZONTAL_PADDING}
            y={y + height / 2}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-muted-foreground font-mono font-medium tabular-nums opacity-80"
            fontSize={RANK_LABEL_FONT_SIZE}
            pointerEvents="none"
            style={{ whiteSpace: 'pre' }}
        >
            {label}
        </text>
    );
}

function MixedBarChartValueLabel({
    formatter,
    parentViewBox,
    value,
    viewBox,
}: MixedBarChartValueLabelProps) {
    const labelViewBox = getMixedBarChartLabelViewBox(viewBox);

    if (!labelViewBox) {
        return null;
    }

    const chartViewBox = getMixedBarChartLabelViewBox(parentViewBox);
    const { height, y } = labelViewBox;
    const x = chartViewBox
        ? chartViewBox.x + chartViewBox.width
        : labelViewBox.x + labelViewBox.width + LABEL_HORIZONTAL_PADDING;

    return (
        <text
            x={x}
            y={y + height / 2}
            textAnchor="end"
            dominantBaseline="central"
            className="fill-foreground font-mono font-medium tabular-nums"
            fontSize={VALUE_LABEL_FONT_SIZE}
            pointerEvents="none"
            style={{ whiteSpace: 'pre' }}
        >
            {formatDisplayValue(Number(value), formatter, undefined, undefined)}
        </text>
    );
}

function formatDisplayValue(
    value: number,
    formatter: MixedBarChartValueFormatter,
    item: MixedBarChartDataItem | undefined,
    suffix: string | undefined,
): string {
    const formattedValue = formatter(value, item);

    return suffix ? `${formattedValue} ${suffix}` : String(formattedValue);
}

function formatRankLabel(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    return `#${value}`;
}

function getChartConfigColor(
    config: ChartConfig | undefined,
    key: string,
): string | undefined {
    const item = config?.[key];

    if (item && 'color' in item) {
        return item.color;
    }
}

export function BarChartMixed({
    barSize = 30,
    chartClassName,
    chartHeight,
    className,
    config,
    contentClassName,
    data,
    emptyLabel = 'Belum ada data',
    // headerAction,
    icon: Icon,
    labelColor = 'var(--background)',
    maxLabelLength = DEFAULT_MAX_LABEL_LENGTH,
    rowHeight = DEFAULT_ROW_HEIGHT,
    showRank = true,
    title,
    valueFormatter = formatMixedBarChartValue,
    valueSuffix,
}: BarChartMixedProps) {
    const chartConfig = React.useMemo<ChartConfig>(() => {
        const colorConfig = neutralMixedBarChartPalette.reduce<ChartConfig>(
            (items, color, index) => {
                items[`rank-${index + 1}`] = {
                    label: `Urutan ${index + 1}`,
                    color,
                };

                return items;
            },
            {
                label: { color: labelColor },
                rank: { label: 'Urutan' },
                value: { label: 'Value' },
            },
        );

        return { ...colorConfig, ...config };
    }, [config, labelColor]);

    const chartData = React.useMemo<RankedMixedBarChartDataItem[]>(
        () =>
            data.map((item, index) => ({
                ...item,
                fill:
                    item.color ??
                    getChartConfigColor(chartConfig, `rank-${index + 1}`) ??
                    neutralMixedBarChartPalette[
                        index % neutralMixedBarChartPalette.length
                    ],
                rank: item.rank ?? index + 1,
            })),
        [chartConfig, data],
    );

    const hasData = chartData.length > 0;

    const maxValue = React.useMemo(
        () => chartData.reduce((max, item) => Math.max(max, item.value), 0),
        [chartData],
    );

    const resolvedChartHeight =
        chartHeight ??
        Math.max(DEFAULT_CHART_HEIGHT, chartData.length * rowHeight);

    return (
        <Card className={cn('admin-card flex flex-col', className)}>
            {title ? (
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div className="flex min-w-0 items-center gap-2">
                        {Icon ? (
                            <Icon className="size-6 shrink-0 text-muted-foreground/75" />
                        ) : null}
                        <CardTitle className="text-md truncate font-semibold tracking-normal">
                            {title}
                        </CardTitle>
                    </div>
                </CardHeader>
            ) : null}

            <CardContent className={cn(contentClassName)}>
                {hasData ? (
                    <ChartContainer
                        config={chartConfig}
                        className={cn('w-full', chartClassName)}
                        style={{ height: resolvedChartHeight }}
                    >
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            layout="vertical"
                            margin={{
                                top: 0,
                                right: 28,
                                bottom: 0,
                                left: showRank ? 28 : 0,
                            }}
                            barSize={barSize}
                            barCategoryGap="40%"
                        >
                            <XAxis
                                dataKey="value"
                                type="number"
                                hide
                                domain={[0, Math.max(maxValue, 1)]}
                            />
                            <YAxis
                                dataKey="label"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                hide
                            />
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        className="min-w-[160px]"
                                        formatter={(value, name, item) => (
                                            <div className="flex min-w-0 items-center justify-between gap-4">
                                                <span className="min-w-0 truncate text-muted-foreground">
                                                    {item.payload?.label ??
                                                        name}
                                                </span>
                                                <span className="shrink-0 font-mono font-medium whitespace-nowrap tabular-nums">
                                                    {formatDisplayValue(
                                                        Number(value),
                                                        valueFormatter,
                                                        item.payload,
                                                        valueSuffix,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    />
                                }
                            />
                            <Bar
                                dataKey="value"
                                radius={4}
                                fill={BASE_COLOR}
                                background={{
                                    fill: 'var(--muted)',
                                    fillOpacity: BAR_TRACK_OPACITY,
                                    radius: 4,
                                }}
                            >
                                {chartData.map((item) => (
                                    <Cell key={item.id} fill={item.fill} />
                                ))}
                                {showRank ? (
                                    <LabelList
                                        dataKey="rank"
                                        content={({ value, viewBox }) => (
                                            <MixedBarChartRankLabel
                                                value={value}
                                                viewBox={viewBox}
                                            />
                                        )}
                                    />
                                ) : null}
                                <LabelList
                                    dataKey="label"
                                    content={({ value, viewBox }) => (
                                        <MixedBarChartLabel
                                            maxLength={maxLabelLength}
                                            value={value}
                                            viewBox={viewBox}
                                        />
                                    )}
                                />
                                <LabelList
                                    dataKey="value"
                                    content={({
                                        parentViewBox,
                                        value,
                                        viewBox,
                                    }) => (
                                        <MixedBarChartValueLabel
                                            formatter={valueFormatter}
                                            parentViewBox={parentViewBox}
                                            value={value}
                                            viewBox={viewBox}
                                        />
                                    )}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[140px] flex-col items-center justify-center gap-2 text-muted-foreground">
                        {Icon ? <Icon className="size-7 opacity-20" /> : null}
                        <p className="text-sm">{emptyLabel}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
