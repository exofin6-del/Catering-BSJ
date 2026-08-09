<?php

namespace App\Http\Requests\Paket;

use Illuminate\Contracts\Validation\ValidationRule;

class StorePackageRequest extends PackageRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->packageRules(isUpdate: false);
    }
}
