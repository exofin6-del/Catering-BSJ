export function parseDashboardDecimal(
    value: number | string | null | undefined,
): number {
    const parsed = Number(value ?? 0);

    return Number.isFinite(parsed) ? parsed : 0;
}

export function formatDashboardCurrency(
    value: number | string | null | undefined,
): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(parseDashboardDecimal(value));
}

export function formatDashboardNumber(
    value: number | null | undefined,
): string {
    return new Intl.NumberFormat('id-ID').format(value ?? 0);
}

export function formatDashboardPercent(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 1,
        minimumFractionDigits: 0,
        style: 'percent',
    }).format(value / 100);
}

export function formatDashboardDate(value: string | null | undefined): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return '-';
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}
