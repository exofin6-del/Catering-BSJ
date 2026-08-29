<?php

namespace App\Http\Requests\Customer;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AuthenticateCustomerWithGoogleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
        return [
            'credential' => ['required_without:code', 'nullable', 'string', 'max:4096'],
            'code' => ['required_without:credential', 'nullable', 'string', 'max:4096'],
            'state' => ['required', 'string', 'max:2048'],
        ];
    }

    public function credential(): string
    {
        return (string) $this->validated('credential');
    }

    public function state(): string
    {
        return (string) $this->validated('state');
    }
}
