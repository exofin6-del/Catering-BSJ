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
        $rules = $this->orderRules(isUpdate: false, requiresLocation: true);

        // All fields are required on the storefront checkout except notes.
        $rules['event_time'] = ['required', 'date_format:H:i'];
        $rules['address_name'] = ['required', 'string', 'max:255'];
        $rules['latitude'] = ['required', 'numeric', 'between:-90,90'];
        $rules['longitude'] = ['required', 'numeric', 'between:-180,180'];

        return $rules;
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
