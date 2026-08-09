'use client';

import type { LucideIcon } from 'lucide-react';
import * as React from 'react';
import { Cell, Label, Pie, PieChart } from 'recharts';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export type DonutChartDataItem = {
    color?: string;
    id: string;
    label: string;
    value: number;
};

export type DonutChartDisplayValue = string | number;

export type DonutChartValueFormatter = (
    value: number,
    item?: DonutChartDataItem,
) => DonutChartDisplayValue;

type DonutChartWithTextProps = {
    centerLabel?: DonutChartDisplayValue;
    centerValue?: DonutChartDisplayValue;
    chartClassName?: string;
    className?: string;
    config?: ChartConfig;
    contentClassName?: string;
    data: DonutChartDataItem[];
    description?: string;
    emptyLabel?: string;
    icon?: LucideIcon;
    innerRadius?: number;
    legendClassName?: string;
    outerRadius?: number;
    showLegend?: boolean;
    title?: string;
    totalValue?: number;
    valueFormatter?: DonutChartValueFormatter;
};

type FilledDonutChartDataItem = DonutChartDataItem & {
    fill: string;
};

const EMPTY_CHART_SEGMENT: FilledDonutChartDataItem = {
    id: 'empty',
    label: 'Tidak ada data',
    value: 1,
    fill: 'var(--muted)',
};

export const neutralDonutChartPalette = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
] as const;

export function formatDonutChartValue(value: number): string {
    return new Intl.NumberFormat('id-ID').format(value);
}

export function DonutChartWithText({
    centerLabel = 'Total',
    centerValue,
    chartClassName,
    className,
    config,
    contentClassName,
    data,
    description,
    emptyLabel = 'Tidak ada data',
    icon: Icon,
    innerRadius = 50,
    legendClassName,
    outerRadius = 70,
    showLegend = true,
    title,
    totalValue,
    valueFormatter = formatDonutChartValue,
}: DonutChartWithTextProps) {
    const normalizedData = React.useMemo(
        () =>
            data.map((item) => ({
                ...item,
                value: Math.max(0, item.value),
            })),
        [data],
    );

    const resolvedTotalValue = React.useMemo(
        () =>
            totalValue ??
            normalizedData.reduce((total, item) => total + item.value, 0),
        [normalizedData, totalValue],
    );
    const hasData = resolvedTotalValue > 0;

    const chartConfig = React.useMemo<ChartConfig>(() => {
        const itemConfig = normalizedData.reduce<ChartConfig>(
            (items, item, index) => {
                items[item.id] = {
                    label: item.label,
                    color:
                        item.color ??
                        getChartConfigColor(config, item.id) ??
                        neutralDonutChartPalette[
                            index % neutralDonutChartPalette.length
                        ],
                };

                return items;
            },
            {},
        );

        return {
            ...config,
            ...itemConfig,
        };
    }, [config, normalizedData]);

    const chartData = React.useMemo<FilledDonutChartDataItem[]>(
        () =>
            hasData
                ? normalizedData.map((item, index) => ({
                      ...item,
                      fill:
                          item.color ??
                          getChartConfigColor(chartConfig, item.id) ??
                          neutralDonutChartPalette[
                              index % neutralDonutChartPalette.length
                          ],
                  }))
                : [
                      {
                          ...EMPTY_CHART_SEGMENT,
                          label: emptyLabel,
                      },
                  ],
        [chartConfig, emptyLabel, hasData, normalizedData],
    );

    const legendData = React.useMemo<FilledDonutChartDataItem[]>(
        () =>
            hasData
                ? chartData
                : [
                      {
                          ...EMPTY_CHART_SEGMENT,
                          label: emptyLabel,
                          value: 0,
                      },
                  ],
        [chartData, emptyLabel, hasData],
    );

    const centerDisplayValue =
        centerValue ?? valueFormatter(resolvedTotalValue);

    return (
        <Card className={cn('admin-card flex flex-col', className)}>
            {title ? (
                <CardHeader className="gap-3 space-y-0">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 items-center gap-2.5">
                            {Icon ? (
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/50 text-muted-foreground">
                                    <Icon className="size-4.5" />
                                </span>
                            ) : null}
                            <div className="min-w-0">
                                <CardTitle className="text-md truncate font-semibold tracking-normal">
                                    {title}
                                </CardTitle>
                                {description ? (
                                    <CardDescription className="mt-1 text-xs">
                                        {description}
                                    </CardDescription>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </CardHeader>
            ) : null}

            <CardContent
                className={cn(
                    'grid flex-1 grid-cols-[auto_1fr] items-center gap-6 px-4 pb-4 sm:px-6 sm:pb-6',
                    contentClassName,
                )}
            >
                <ChartContainer
                    config={chartConfig}
                    className={cn('size-[140px] shrink-0', chartClassName)}
                >
                    <PieChart>
                        {hasData ? (
                            <ChartTooltip
                                cursor={false}
                                content={
                                    <ChartTooltipContent
                                        hideLabel
                                        nameKey="id"
                                        className="min-w-[140px]"
                                        formatter={(value, name, item) => (
                                            <div className="flex w-full items-center justify-between gap-4">
                                                <span
                                                    className="text-sm"
                                                    style={{
                                                        color: item.payload
                                                            ?.fill,
                                                    }}
                                                >
                                                    {item.payload?.label ??
                                                        name}
                                                </span>
                                                <span className="font-mono font-medium tabular-nums">
                                                    {valueFormatter(
                                                        Number(value),
                                                        item.payload,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    />
                                }
                            />
                        ) : null}

                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="id"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            strokeWidth={0}
                            activeShape={undefined}
                        >
                            {chartData.map((entry) => (
                                <Cell
                                    key={entry.id}
                                    fill={entry.fill}
                                    opacity={1}
                                />
                            ))}

                            <Label
                                content={({ viewBox }) => {
                                    if (
                                        viewBox &&
                                        'cx' in viewBox &&
                                        'cy' in viewBox
                                    ) {
                                        return (
                                            <text
                                                x={viewBox.cx}
                                                y={viewBox.cy}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                <tspan
                                                    x={viewBox.cx}
                                                    y={viewBox.cy}
                                                    className="fill-foreground text-2xl font-semibold tabular-nums"
                                                >
                                                    {centerDisplayValue}
                                                </tspan>
                                                {centerLabel ? (
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={
                                                            (viewBox.cy ?? 0) +
                                                            18
                                                        }
                                                        className="fill-muted-foreground text-[10px] tracking-wider uppercase"
                                                    >
                                                        {centerLabel}
                                                    </tspan>
                                                ) : null}
                                            </text>
                                        );
                                    }
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                {showLegend ? (
                    <div className={cn('flex flex-col', legendClassName)}>
                        {legendData.map((item) => (
                            <DonutChartLegendRow
                                key={item.id}
                                color={item.fill}
                                label={item.label}
                                value={item.value}
                                valueFormatter={valueFormatter}
                            />
                        ))}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function DonutChartLegendRow({
    color,
    label,
    value,
    valueFormatter,
}: {
    color: string;
    label: string;
    value: number;
    valueFormatter: DonutChartValueFormatter;
}) {
    return (
        <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-b-0">
            <div className="flex min-w-0 items-center gap-2.5">
                <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span
                    className="truncate text-sm font-medium"
                    style={{ color }}
                    title={label}
                >
                    {label}
                </span>
            </div>
            <span className="shrink-0 font-mono text-sm font-medium text-foreground tabular-nums">
                {valueFormatter(value)}
            </span>
        </div>
    );
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
