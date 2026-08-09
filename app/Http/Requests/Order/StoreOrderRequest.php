<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;

class StoreOrderRequest extends OrderRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->orderRules(isUpdate: false, requiresLocation: false);
    }
}
