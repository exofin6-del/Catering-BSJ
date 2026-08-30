<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GoogleRecaptchaService
{
    /**
     * Verify a reCAPTCHA v3 token with Google's siteverify API.
     *
     * Returns true when no secret key is configured so local development and
     * tests keep working until credentials are provided.
     */
    public function verify(string $token, ?string $remoteIp = null): bool
    {
        $secret = (string) config('recaptcha.secret_key');

        if ($secret === '') {
            return true;
        }

        $response = Http::asForm()
            ->timeout(5)
            ->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => $secret,
                'response' => $token,
                'remoteip' => $remoteIp,
            ]);

        if ($response->failed()) {
            return false;
        }

        $payload = $response->json();

        return ($payload['success'] ?? false) === true
            && (float) ($payload['score'] ?? 0.0) >= (float) config('recaptcha.min_score', 0.5);
    }
}
