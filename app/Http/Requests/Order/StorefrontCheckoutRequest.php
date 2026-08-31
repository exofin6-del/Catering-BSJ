<?php

namespace App\Http\Requests\Order;

use App\Rules\Recaptcha;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

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

        // Storefront carts are capped at ten distinct item types.
        $rules['items'] = [...$rules['items'], 'max:10'];

        // Each line item is capped at 3000 units.
        $rules['items.*.qty'] = [...$rules['items.*.qty'], 'lte:3000'];

        // All fields are required on the storefront checkout except notes.
        $rules['event_time'] = ['required', 'date_format:H:i'];
        $rules['address_name'] = ['required', 'string', 'max:255'];
        $rules['latitude'] = ['required', 'numeric', 'between:-90,90'];
        $rules['longitude'] = ['required', 'numeric', 'between:-180,180'];

        // Bot protection: required once secret key is configured, or validated if provided.
        if ((string) config('recaptcha.secret_key') !== '') {
            $rules['recaptcha_token'] = ['required', 'string', app(Recaptcha::class)];
        } elseif ($this->filled('recaptcha_token')) {
            $rules['recaptcha_token'] = ['string', app(Recaptcha::class)];
        }

        return $rules;
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        if ($this->expectsJson() || $this->wantsJson() || $this->isJson()) {
            throw new HttpResponseException(
                response()->json([
                    'message' => __('Verifikasi reCAPTCHA atau data yang diberikan tidak valid.'),
                    'errors' => $validator->errors(),
                ], 422)
            );
        }

        parent::failedValidation($validator);
    }

    /**
     * Get the custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.max' => __('Keranjang maksimal sepuluh jenis item.'),
            'items.*.qty.lte' => __('Jumlah per item maksimal 3000.'),
        ];
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
