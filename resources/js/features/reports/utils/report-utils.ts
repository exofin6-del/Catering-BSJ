import type { ReportFilters, ReportPeriod } from '../types/report-types';

export const reportPeriodOptions: { label: string; value: ReportPeriod }[] = [
    { label: 'Hari Ini', value: 'daily' },
    { label: 'Bulan Ini', value: 'monthly' },
    { label: 'Tahun Ini', value: 'yearly' },
    { label: 'Semua Waktu', value: 'all' },
    { label: 'Rentang Custom', value: 'custom' },
];

export const paymentMethodLabels: Record<string, string> = {
    cash: 'Tunai',
    manual: 'Manual',
    transfer: 'Transfer',
};

export const paymentTypeLabels: Record<string, string> = {
    dp: 'DP',
    full: 'Lunas',
    remaining: 'Pelunasan',
};

export function formatReportPrice(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(value);
}

export function buildReportQuery(filters: Partial<ReportFilters> & {}) {
    const period = filters.period ?? 'monthly';
    const query: Record<string, string> = {
        period,
    };

    if (period === 'custom') {
        if (filters.start_date) {
            query.start_date = filters.start_date;
        }

        if (filters.end_date) {
            query.end_date = filters.end_date;
        }
    }

    return query;
}

export function formatReportDate(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function formatReportDateTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function reportPeriodSentenceLabel(filters: ReportFilters): string {
    if (filters.period === 'all') {
        return 'semua tanggal lunas';
    }

    const selectedPeriod = reportPeriodOptions.find(
        (option) => option.value === filters.period,
    );

    return selectedPeriod?.label.toLowerCase() ?? 'bulanan';
}

export function safePercent(value: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((value / total) * 100);
}
