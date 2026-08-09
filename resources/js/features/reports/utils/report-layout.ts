import { createElement } from 'react';
import { dashboard } from '@/routes';
import reportRoute from '@/routes/report';
import { ReportExportDropdown } from '../components/report-export-dropdown';
import type { ReportPageProps } from '../types/report-types';

export const reportSummaryLayout = ({ filters }: ReportPageProps) => ({
    title: 'Ringkasan Laporan',
    description:
        'Pantau omset, pembayaran, dan produk terlaris dari pesanan selesai.',
    action: {
        content: createElement(ReportExportDropdown, {
            filters,
            key: [filters.end_date, filters.period, filters.start_date].join(
                '|',
            ),
        }),
        label: 'Ekspor',
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Laporan',
            href: reportRoute.index(),
        },
    ],
});

export const reportSalesLayout = {
    title: 'Penjualan',
    description:
        'Detail pembayaran dan riwayat pesanan selesai pada periode laporan.',
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Laporan',
            href: reportRoute.index(),
        },
        {
            title: 'Penjualan',
            href: reportRoute.sales(),
        },
    ],
};
