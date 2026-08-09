<?php

namespace App\Http\Controllers\Report;

use App\Actions\Report\ReportAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportExportController extends Controller
{
    public function __invoke(Request $request, ReportAction $reports): JsonResponse|StreamedResponse
    {
        $data = $reports->getReportData($request->validate([
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'period' => ['nullable', Rule::in(['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'])],
            'start_date' => ['nullable', 'date'],
        ]));

        if ($request->expectsJson()) {
            return response()->json($data);
        }

        $orders = $reports->exportOrders($data['filters']);

        $filters = $data['filters'];
        $fileName = sprintf('laporan-%s-%s.csv', $filters['start_date'], $filters['end_date']);

        return response()->streamDownload(function () use ($data, $orders): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            // BOM for Excel UTF-8
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, ['Laporan Catering BSJ']);
            fputcsv($output, ['Periode', $data['filters']['start_date'], $data['filters']['end_date']]);
            fputcsv($output, []);

            fputcsv($output, ['Ringkasan']);
            fputcsv($output, ['Metrik', 'Nilai']);
            fputcsv($output, ['Omset', $data['summary']['total_revenue']]);
            fputcsv($output, ['Dibayar', $data['summary']['total_paid']]);
            fputcsv($output, ['Piutang', $data['summary']['total_receivable']]);
            fputcsv($output, ['Jumlah order', $data['summary']['order_count']]);
            fputcsv($output, ['Rata-rata order', $data['summary']['average_order_value']]);
            fputcsv($output, []);

            fputcsv($output, ['Riwayat Order']);
            fputcsv($output, ['Tanggal order', 'Kode', 'Pelanggan', 'Acara', 'Tanggal acara', 'Status', 'Pembayaran', 'Total', 'Dibayar', 'Sisa']);
            foreach ($orders as $order) {
                fputcsv($output, [
                    $order['created_at'],
                    $order['order_code'],
                    $order['customer_name'],
                    $order['event_name'],
                    $order['event_date'],
                    Str::headline((string) $order['status']),
                    Str::headline((string) $order['payment_status']),
                    $order['total_price'],
                    $order['paid_amount'],
                    $order['remaining_amount'],
                ]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Status Order']);
            fputcsv($output, ['Status', 'Jumlah', 'Total']);
            foreach ($data['status_breakdown'] as $status => $row) {
                fputcsv($output, [Str::headline((string) $status), $row['count'], $row['total_amount']]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Menu Terlaris']);
            fputcsv($output, ['Menu', 'Qty', 'Omset']);
            foreach ($data['popular_menu_items'] as $item) {
                fputcsv($output, [$item['name'], $item['qty'], $item['revenue']]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Paket Terlaris']);
            fputcsv($output, ['Paket', 'Qty', 'Omset']);
            foreach ($data['popular_packages'] as $item) {
                fputcsv($output, [$item['name'], $item['qty'], $item['revenue']]);
            }
            fputcsv($output, []);

            fputcsv($output, ['Pembayaran Terbaru']);
            fputcsv($output, ['Order', 'Pelanggan', 'Tipe', 'Metode', 'Jumlah', 'Tanggal']);
            foreach ($data['recent_payments'] as $payment) {
                fputcsv($output, [
                    $payment['order_code'],
                    $payment['customer_name'],
                    $payment['type'],
                    $payment['method'],
                    $payment['amount'],
                    $payment['paid_at'],
                ]);
            }

            fclose($output);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
