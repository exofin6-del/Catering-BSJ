<?php

namespace App\Http\Controllers\Schedule;

use App\Actions\Schedule\ScheduleAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ScheduleExportController extends Controller
{
    public function __invoke(Request $request, ScheduleAction $schedules): JsonResponse|StreamedResponse
    {
        $filters = $request->query();
        $results = $schedules->export($filters);

        if ($request->expectsJson()) {
            return response()->json(['items' => $results]);
        }

        $fileName = 'jadwal-ekspor-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($results): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            // BOM for Excel UTF-8
            fwrite($output, "\xEF\xBB\xBF");

            fputcsv($output, [
                'ID',
                'Pelanggan',
                'Telepon',
                'Acara',
                'Jam',
                'Alamat',
                'Lokasi',
                'Total',
                'Status Pembayaran',
                'Status Order',
                'Dibuat',
            ]);

            foreach ($results as $serialized) {
                $totalPrice = (float) ($serialized['total_price'] ?? 0);

                fputcsv($output, [
                    $serialized['id'],
                    $serialized['customer_name'],
                    $serialized['phone'],
                    $serialized['event_name'],
                    $serialized['event_time'],
                    $serialized['address_name'] ?: 'Belum diisi',
                    $this->googleMapsUrl($serialized),
                    $totalPrice,
                    $serialized['payment_status'],
                    $serialized['status'],
                    $serialized['schedule_state'], // Using schedule_state instead of created_at as it might be useful
                ]);
            }

            fclose($output);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @param  array<string, mixed>  $serialized
     */
    private function googleMapsUrl(array $serialized): string
    {
        $latitude = $serialized['latitude'] ?? null;
        $longitude = $serialized['longitude'] ?? null;

        if (! is_numeric($latitude) || ! is_numeric($longitude)) {
            return 'Lokasi belum tersedia';
        }

        $latitude = (float) $latitude;
        $longitude = (float) $longitude;

        if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
            return 'Lokasi belum tersedia';
        }

        return 'https://www.google.com/maps/search/?api=1&query='.rawurlencode("{$latitude},{$longitude}");
    }
}
