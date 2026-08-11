<?php

namespace App\Http\Requests\Order;

use App\Models\Order;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class AcceptOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $recordsPayment = $this->boolean('record_payment');

        return [
            'record_payment' => ['required', 'boolean'],
            'payment_amount' => [
                Rule::requiredIf($recordsPayment),
                'nullable',
                'numeric',
                'gt:0',
            ],
            'payment_method' => [
                Rule::requiredIf($recordsPayment),
                'nullable',
                Rule::in(['transfer', 'cash']),
            ],
            'payment_paid_at' => [
                Rule::requiredIf($recordsPayment),
                'nullable',
                'date',
            ],
            'proof_image' => ['nullable', File::image()],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->boolean('record_payment') || $validator->errors()->has('payment_amount')) {
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

                if ((float) $this->input('payment_amount') > $remainingAmount) {
                    $validator->errors()->add(
                        'payment_amount',
                        __('Nominal pembayaran tidak boleh melebihi sisa tagihan.'),
                    );
                }
            },
        ];
    }

    public function recordsPayment(): bool
    {
        return $this->boolean('record_payment');
    }
}
