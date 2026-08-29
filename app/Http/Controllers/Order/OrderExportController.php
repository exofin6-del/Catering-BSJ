<?php

namespace App\Http\Controllers\Order;

use App\Actions\Admin\Order\OrderAction;
use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OrderExportController extends Controller
{
    public function __invoke(Request $request, OrderAction $orders): StreamedResponse
    {
        $filters = $orders->normalizeIndexFilters($request->only([
            'event_date_from',
            'event_date_to',
            'payment_status',
            'payment_type',
            'search',
            'sort_by',
            'sort_dir',
            'status',
        ]));

        $format = $request->string('format', 'csv')->toString();

        if (! in_array($format, ['csv', 'excel'], true)) {
            $format = 'csv';
        }

        $results = $orders->export($filters);
        $fileName = 'order-ekspor-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($results, $orders): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            // BOM for Excel UTF-8
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, [
                'ID',
                'Kode',
                'Pelanggan',
                'Telepon',
                'Acara',
                'Tanggal Acara',
                'Jam',
                'Total',
                'Dibayar',
                'Sisa',
                'Status Pembayaran',
                'Tipe Pembayaran',
                'Status Order',
                'Dibuat',
            ]);

            foreach ($results as $order) {
                /** @var Order $order */
                $serialized = $orders->serialize($order);

                $totalPrice = (float) ($serialized['total_price'] ?? 0);
                $paidAmount = (float) ($serialized['paid_amount'] ?? 0);
                $remaining = $totalPrice - $paidAmount;

                fputcsv($output, [
                    $serialized['id'],
                    $serialized['order_code'],
                    $serialized['customer_name'],
                    $serialized['phone'],
                    $serialized['event_name'],
                    $serialized['event_date'],
                    $serialized['event_time'],
                    $totalPrice,
                    $paidAmount,
                    $remaining,
                    $serialized['payment_status'],
                    $serialized['payment_type'],
                    $serialized['status'],
                    $serialized['created_at'],
                ]);
            }

            fclose($output);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
