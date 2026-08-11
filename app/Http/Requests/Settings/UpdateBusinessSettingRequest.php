<?php

namespace App\Http\Requests\Settings;

use App\CustomerTheme;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateBusinessSettingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
        return [
            'business_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'whatsapp_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
                'regex:/^(?:\+62|62|0)[0-9\s()\-]{8,27}$/',
            ],
            'business_lat' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'business_lng' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'business_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'max_order_km' => ['sometimes', 'required', 'numeric', 'min:1', 'max:100'],
            'max_orders_per_day' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000'],
            'operational_start_time' => ['sometimes', 'required', 'date_format:H:i'],
            'operational_end_time' => ['sometimes', 'required', 'date_format:H:i'],
            'is_open' => ['sometimes', 'required', 'boolean'],
            'customer_theme' => ['sometimes', 'required', Rule::enum(CustomerTheme::class)],
            'description' => ['nullable', 'string', 'max:1000'],
            'hero_image_0' => ['nullable', 'sometimes', 'image'],
            'hero_image_1' => ['nullable', 'sometimes', 'image'],
            'hero_image_2' => ['nullable', 'sometimes', 'image'],
            'remove_hero_image_0' => ['nullable', 'boolean'],
            'remove_hero_image_1' => ['nullable', 'boolean'],
            'remove_hero_image_2' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->has('operational_start_time') || ! $this->has('operational_end_time')) {
                    return;
                }

                if ($validator->errors()->has('operational_start_time') || $validator->errors()->has('operational_end_time')) {
                    return;
                }

                if ((string) $this->input('operational_start_time') >= (string) $this->input('operational_end_time')) {
                    $validator->errors()->add('operational_end_time', __('Jam tutup harus setelah jam buka.'));
                }
            },
        ];
    }
}
