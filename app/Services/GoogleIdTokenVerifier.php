<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class GoogleIdTokenVerifier
{
    /**
     * @return array{google_id: string, name: string, email: string, avatar: string|null}
     */
    public function verify(string $credential): array
    {
        $clientId = (string) config('services.google.client_id');

        if ($clientId === '') {
            throw ValidationException::withMessages([
                'credential' => __('Google sign-in is not configured.'),
            ]);
        }

        try {
            $response = Http::acceptJson()
                ->connectTimeout(3)
                ->timeout(5)
                ->get('https://oauth2.googleapis.com/tokeninfo', [
                    'id_token' => $credential,
                ]);
        } catch (ConnectionException) {
            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        $identity = $response->json();
        $email = is_array($identity) ? ($identity['email'] ?? null) : null;
        $googleId = is_array($identity) ? ($identity['sub'] ?? null) : null;
        $name = is_array($identity) ? ($identity['name'] ?? null) : null;

        if (
            $clientId === '' ||
            ! is_array($identity) ||
            ! is_string($googleId) ||
            ! is_string($name) ||
            ! is_string($email) ||
            ! filter_var($email, FILTER_VALIDATE_EMAIL) ||
            ! hash_equals($clientId, (string) ($identity['aud'] ?? '')) ||
            ! in_array($identity['iss'] ?? null, ['accounts.google.com', 'https://accounts.google.com'], true) ||
            ! filter_var($identity['email_verified'] ?? false, FILTER_VALIDATE_BOOL)
        ) {
            Log::error('Google ID token verification failed', [
                'expected_client_id' => $clientId,
                'identity' => $identity,
            ]);

            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        return [
            'google_id' => $googleId,
            'name' => $name,
            'email' => $email,
            'avatar' => is_string($identity['picture'] ?? null) ? $identity['picture'] : null,
        ];
    }

    /**
     * Exchange an OAuth authorization code for an ID Token via Google's token endpoint.
     */
    public function exchangeCodeForIdToken(string $code, string $redirectUri): string
    {
        $clientId = (string) config('services.google.client_id');
        $clientSecret = (string) config('services.google.client_secret');

        try {
            $response = Http::asForm()
                ->connectTimeout(3)
                ->timeout(5)
                ->post('https://oauth2.googleapis.com/token', [
                    'code' => $code,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => $redirectUri,
                    'grant_type' => 'authorization_code',
                ]);
        } catch (ConnectionException) {
            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        if (! $response->successful()) {
            Log::error('Google code exchange failed', [
                'response' => $response->json(),
            ]);

            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        $data = $response->json();
        $idToken = is_array($data) ? ($data['id_token'] ?? null) : null;

        if (! is_string($idToken) || $idToken === '') {
            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }

        return $idToken;
    }
}
