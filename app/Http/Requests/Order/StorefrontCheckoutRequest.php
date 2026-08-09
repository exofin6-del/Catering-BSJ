<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;

class StorefrontCheckoutRequest extends OrderRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->orderRules(isUpdate: false, requiresLocation: true);
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->merge([
            'payment_amount' => null,
            'payment_method' => null,
            'payment_paid_at' => null,
            'payment_type' => 'full',
            'proof_image' => null,
            'status' => 'pending_confirmation',
        ]);
    }
}
