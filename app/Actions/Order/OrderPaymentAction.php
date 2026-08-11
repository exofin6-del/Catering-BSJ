<?php

namespace App\Actions\Order;

use App\Models\Order;
use App\Models\Payment;
use App\Services\ImageCompressionService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderPaymentAction
{
    public function __construct(private ImageCompressionService $compressor)
    {
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(Order $order, array $data): Payment
    {
        return DB::transaction(function () use ($order, $data): Payment {
            $lockedOrder = Order::query()
                ->whereKey($order->getKey())
                ->lockForUpdate()
                ->firstOrFail();
            $paidAmount = (float) $lockedOrder->payments()->sum('amount');
            $remainingAmount = max(0, (float) $lockedOrder->total_price - $paidAmount);
            $paymentAmount = (float) $data['amount'];

            if ($lockedOrder->status !== 'confirmed') {
                throw ValidationException::withMessages([
                    'status' => __('Pelunasan hanya dapat dicatat untuk order yang sudah dikonfirmasi.'),
                ]);
            }

            if ($paymentAmount <= 0 || $paymentAmount > $remainingAmount) {
                throw ValidationException::withMessages([
                    'amount' => __('Nominal pembayaran harus lebih dari nol dan tidak melebihi sisa tagihan.'),
                ]);
            }

            $proofImage = $this->storePaymentProof(
                $lockedOrder,
                $data['proof_image'] ?? null,
            );
            $payment = $lockedOrder->payments()->create([
                'type' => $paidAmount > 0 ? 'remaining' : 'full',
                'amount' => $this->decimal($paymentAmount),
                'method' => $data['method'] ?? 'manual',
                'paid_at' => $data['paid_at'] ?? now(),
                'proof_image' => $proofImage,
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncPaymentStatus($lockedOrder);

            return $payment->refresh();
        });
    }

    private function storePaymentProof(Order $order, mixed $proofImage): ?string
    {
        if (! $proofImage instanceof UploadedFile) {
            return null;
        }

        // Compress image before storing
        $compressedPath = $this->compressor->compressAndStore(
            $proofImage,
            "payments/{$order->id}",
            'public',
            1920,
            1920,
            85
        );

        if ($compressedPath === false) {
            throw ValidationException::withMessages([
                'proof_image' => __('Bukti pembayaran gagal disimpan.'),
            ]);
        }

        return Storage::disk('public')->url($compressedPath);
    }

    private function syncPaymentStatus(Order $order): void
    {
        $paidAmount = (float) $order->payments()->sum('amount');
        $totalPrice = (float) $order->total_price;
        $remainingAmount = $order->payment_type === 'dp' || $paidAmount > 0
            ? max(0, $totalPrice - $paidAmount)
            : (float) $order->remaining_amount;

        $paymentStatus = match (true) {
            $paidAmount <= 0 => 'unpaid',
            $paidAmount >= $totalPrice => 'paid',
            default => 'dp_paid',
        };

        $order->update([
            'payment_status' => $paymentStatus,
            'remaining_amount' => $this->decimal($remainingAmount),
        ]);
    }

    private function decimal(float|int|string|null $value): string
    {
        return number_format((float) $value, 2, '.', '');
    }
}
