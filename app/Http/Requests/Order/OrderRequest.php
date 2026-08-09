<?php

namespace App\Http\Requests\Order;

use App\Models\BusinessSetting;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Package;
use App\Models\PackageItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

abstract class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->filled('event_time')) {
            $payload['event_time'] = substr((string) $this->input('event_time'), 0, 5);
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function orderRules(bool $isUpdate, bool $requiresLocation = true): array
    {
        $sometimes = $isUpdate ? ['sometimes'] : [];
        $required = $isUpdate ? ['sometimes'] : ['required'];
        $requiredLocation = $requiresLocation ? $required : $sometimes;
        $requiredItems = $isUpdate ? ['sometimes', 'array', 'min:1'] : ['required', 'array', 'min:1'];
        $requiresPaymentDetails = $this->filled('payment_amount');

        return [
            'customer_name' => [...$required, 'string', 'max:255'],
            'phone' => [...$required, 'string', 'max:20'],
            'event_date' => [
                ...$required,
                Rule::date(),
                ...($this->eventDateMustNotBePast($isUpdate) ? [Rule::date()->todayOrAfter()] : []),
            ],
            'event_time' => [...$sometimes, 'nullable', 'date_format:H:i'],
            'event_name' => [...$required, 'string', 'max:255'],
            'event_address' => [...$requiredLocation, 'nullable', 'string'],
            'address_name' => [...$sometimes, 'nullable', 'string'],
            'latitude' => [...$requiredLocation, 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => [...$requiredLocation, 'nullable', 'numeric', 'between:-180,180'],
            'discount' => [...$sometimes, 'nullable', 'numeric', 'min:0'],
            'payment_amount' => [...$sometimes, 'nullable', 'numeric', 'min:0'],
            'payment_method' => [...$sometimes, Rule::requiredIf($requiresPaymentDetails), 'nullable', Rule::in(['transfer', 'cash'])],
            'payment_paid_at' => [...$sometimes, Rule::requiredIf($requiresPaymentDetails), 'nullable', 'date'],
            'proof_image' => [...$sometimes, 'nullable', File::image()->max('2mb')],
            'payment_type' => [...$required, Rule::in(['dp', 'full'])],
            'status' => [...$sometimes, Rule::in(['pending_confirmation', 'confirmed', 'completed', 'canceled'])],
            'notes' => [...$sometimes, 'nullable', 'string'],
            'items' => $requiredItems,
            'items.*' => ['array'],
            'items.*.item_type' => ['required', Rule::in(['menu_item', 'package'])],
            'items.*.menu_item_id' => [
                'nullable',
                'required_if:items.*.item_type,menu_item',
                'integer',
                Rule::exists(MenuItem::class, 'id')->where('is_active', true),
            ],
            'items.*.package_id' => [
                'nullable',
                'required_if:items.*.item_type,package',
                'integer',
                Rule::exists(Package::class, 'id')->where('is_active', true),
            ],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.selected_items' => ['nullable', 'array'],
            'items.*.selected_items.*' => ['array'],
            'items.*.selected_items.*.package_item_id' => ['nullable', 'integer', Rule::exists(PackageItem::class, 'id')],
            'items.*.selected_items.*.menu_item_id' => [
                'required',
                'integer',
                Rule::exists(MenuItem::class, 'id')->where('is_active', true),
            ],
        ];
    }

    private function eventDateMustNotBePast(bool $isUpdate): bool
    {
        if (! $isUpdate) {
            return true;
        }

        $order = $this->route('order');

        if (! $order instanceof Order || ! $this->filled('event_date')) {
            return false;
        }

        return $order->event_date?->format('Y-m-d') !== (string) $this->input('event_date');
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('event_time') || ! $this->filled('event_time')) {
                    return;
                }

                $setting = BusinessSetting::query()->first();
                $startTime = substr((string) ($setting?->operational_start_time ?? '08:00'), 0, 5);
                $endTime = substr((string) ($setting?->operational_end_time ?? '17:00'), 0, 5);
                $eventTime = substr((string) $this->input('event_time'), 0, 5);

                if ($startTime >= $endTime) {
                    return;
                }

                if ($eventTime < $startTime || $eventTime > $endTime) {
                    $validator->errors()->add('event_time', __('Jam mulai harus berada dalam jam operasional (:start - :end).', [
                        'start' => $startTime,
                        'end' => $endTime,
                    ]));
                }
            },
        ];
    }
}
