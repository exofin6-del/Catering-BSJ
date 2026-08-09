import type { ReportOrder } from '../types/report-types';
import { formatReportDate } from './report-utils';

export type ReportMonthGroup = {
    count: number;
    days: ReportDateGroup[];
    id: string;
    label: string;
    totalPaid: number;
};

export type ReportDateGroup = {
    id: string;
    label: string;
    orders: ReportOrder[];
    totalPaid: number;
};

export function groupedOrders(orders: ReportOrder[]): ReportMonthGroup[] {
    const groups: ReportMonthGroup[] = [];

    orders.forEach((order) => {
        const date = parseReportDate(
            order.latest_payment_at ?? order.created_at,
        );
        const monthId = date ? `month-${monthKey(date)}` : 'month-unknown';
        const dayId = date ? `day-${dateKey(date)}` : 'day-unknown';
        let monthGroup = groups.find((group) => group.id === monthId);

        if (!monthGroup) {
            monthGroup = {
                count: 0,
                days: [],
                id: monthId,
                label: date ? monthLabel(date) : 'Bulan tidak tersedia',
                totalPaid: 0,
            };
            groups.push(monthGroup);
        }

        let dayGroup = monthGroup.days.find((group) => group.id === dayId);

        if (!dayGroup) {
            dayGroup = {
                id: dayId,
                label: date
                    ? formatReportDate(
                          order.latest_payment_at ?? order.created_at,
                      )
                    : 'Tanggal lunas tidak tersedia',
                orders: [],
                totalPaid: 0,
            };
            monthGroup.days.push(dayGroup);
        }

        monthGroup.count += 1;
        monthGroup.totalPaid += order.paid_amount;
        dayGroup.orders.push(order);
        dayGroup.totalPaid += order.paid_amount;
    });

    return groups;
}

function monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function dateKey(date: Date): string {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
    ].join('-');
}

function monthLabel(date: Date): string {
    return new Intl.DateTimeFormat('id-ID', {
        month: 'long',
        year: 'numeric',
    }).format(date);
}

export function parseReportDate(value?: string | null): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
}
