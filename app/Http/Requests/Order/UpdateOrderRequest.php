<?php

namespace App\Http\Requests\Order;

use Illuminate\Contracts\Validation\ValidationRule;

class UpdateOrderRequest extends OrderRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->orderRules(isUpdate: true, requiresLocation: false);
    }
}
