<?php

namespace App\Rules;

use App\Services\GoogleRecaptchaService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class Recaptcha implements ValidationRule
{
    public function __construct(
        private readonly GoogleRecaptchaService $recaptcha,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '' || ! $this->recaptcha->verify($value, request()->ip())) {
            $fail(__('Verifikasi keamanan gagal. Silakan coba lagi.'));
        }
    }
}
