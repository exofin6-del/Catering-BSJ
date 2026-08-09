<?php

namespace App\Actions\Order;

use App\Models\BusinessSetting;
use App\Models\Order;
use Illuminate\Validation\ValidationException;

class StorefrontCheckoutAction
{
    public function __construct(
        private readonly OrderAction $orders,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     * @return array{order: Order, whatsapp_url: string}
     */
    public function execute(array $data): array
    {
        $setting = BusinessSetting::query()->first() ?? new BusinessSetting;

        if (! $setting->is_open) {
            throw ValidationException::withMessages([
                'items' => __('Catering sedang tidak menerima order baru.'),
            ]);
        }

        $whatsAppNumber = $setting->normalizedWhatsAppNumber();

        if ($whatsAppNumber === null) {
            throw ValidationException::withMessages([
                'items' => __('Nomor WhatsApp catering belum tersedia. Silakan hubungi admin.'),
            ]);
        }

        $order = $this->orders->create($data);

        return [
            'order' => $order,
            'whatsapp_url' => $this->whatsAppCheckoutUrl(
                $order,
                $whatsAppNumber,
                (string) $setting->business_name,
            ),
        ];
    }

    private function whatsAppCheckoutUrl(Order $order, string $number, string $businessName): string
    {
        $order->loadMissing('items');

        $itemLines = $order->items
            ->values()
            ->map(fn ($item, int $index): string => implode("\n", [
                ($index + 1).". {$item->name_snapshot}",
                "Qty: {$item->qty}",
                'Subtotal: Rp '.number_format((float) $item->subtotal, 0, ',', '.'),
            ]))
            ->all();

        $message = implode("\n", array_filter([
            "Halo {$businessName}, saya sudah membuat pesanan dengan kode {$order->order_code}.",
            '',
            "Nama: {$order->customer_name}",
            "Telepon: {$order->phone}",
            "Nama acara: {$order->event_name}",
            'Tanggal: '.$order->event_date?->format('d-m-Y'),
            $order->event_time ? 'Jam: '.substr((string) $order->event_time, 0, 5) : null,
            "Alamat: {$order->event_address}",
            '',
            ...$itemLines,
            '',
            'Total: Rp '.number_format((float) $order->total_price, 0, ',', '.'),
            '',
            'Mohon konfirmasi ketersediaan dan langkah pembayaran berikutnya.',
        ], fn (?string $line): bool => $line !== null));

        return "https://wa.me/{$number}?text=".urlencode($message);
    }
}
