<?php

namespace App\Http\Requests\Order;

use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreOrderPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'method' => ['required', Rule::in(['transfer', 'cash'])],
            'paid_at' => ['required', 'date'],
            'proof_image' => ['nullable', File::image()],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('amount')) {
                    return;
                }

                $order = $this->route('order');

                if (! $order instanceof Order) {
                    return;
                }

                $remainingAmount = max(
                    0,
                    (float) $order->total_price - (float) $order->payments()->sum('amount'),
                );

                if ((float) $this->input('amount') > $remainingAmount) {
                    $validator->errors()->add(
                        'amount',
                        __('Nominal pembayaran tidak boleh melebihi sisa tagihan.'),
                    );
                }
            },
        ];
    }
}
