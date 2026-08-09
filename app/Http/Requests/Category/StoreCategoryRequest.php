<?php

namespace App\Http\Requests\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCategoryRequest extends FormRequest
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
            'type' => ['required', 'string', Rule::in(['menu', 'paket'])],
            'name' => ['required', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:80'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array{type: string, name: string, icon?: string|null, is_active: bool}
     */
    public function categoryData(): array
    {
        return [
            ...$this->validated(),
            'is_active' => $this->boolean('is_active'),
        ];
    }
}
