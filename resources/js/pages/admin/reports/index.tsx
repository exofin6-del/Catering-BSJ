import { Head } from '@inertiajs/react';

import { ReportSummaryPage } from '@/features/reports/pages/report-summary-page';
import type { ReportPageProps } from '@/features/reports/types/report-types';
import { reportSummaryLayout } from '@/features/reports/utils/report-layout';

export default function ReportIndexPage(props: ReportPageProps) {
    return (
        <>
            <Head title="Ringkasan Laporan" />
            <ReportSummaryPage {...props} />
        </>
    );
}

ReportIndexPage.layout = reportSummaryLayout;
