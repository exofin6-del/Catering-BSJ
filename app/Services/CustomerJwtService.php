<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Str;

class CustomerJwtService
{
    /**
     * @return array{customer_id: int, expires_at: int}
     */
    public function claims(string $token): ?array
    {
        [$encodedHeader, $encodedPayload, $signature] = array_pad(explode('.', $token), 3, null);

        if (! is_string($encodedHeader) || ! is_string($encodedPayload) || ! is_string($signature)) {
            return null;
        }

        $expectedSignature = $this->base64UrlEncode(hash_hmac(
            'sha256',
            "{$encodedHeader}.{$encodedPayload}",
            $this->secret(),
            true,
        ));

        if (! hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $header = $this->decodeJson($encodedHeader);
        $payload = $this->decodeJson($encodedPayload);

        if (($header['alg'] ?? null) !== 'HS256' || ! is_array($payload)) {
            return null;
        }

        $customerId = filter_var($payload['sub'] ?? null, FILTER_VALIDATE_INT);
        $expiresAt = filter_var($payload['exp'] ?? null, FILTER_VALIDATE_INT);

        if (
            $customerId === false ||
            $customerId < 1 ||
            $expiresAt === false ||
            $expiresAt <= now()->timestamp ||
            filter_var($payload['nbf'] ?? null, FILTER_VALIDATE_INT) > now()->timestamp ||
            ($payload['aud'] ?? null) !== config('customer-auth.audience') ||
            ! $this->isValidIssuer((string) ($payload['iss'] ?? ''))
        ) {
            return null;
        }

        return [
            'customer_id' => $customerId,
            'expires_at' => $expiresAt,
        ];
    }

    public function issue(Customer $customer): string
    {
        $issuedAt = now()->timestamp;
        $expiresAt = now()->addMinutes((int) config('customer-auth.lifetime'))->timestamp;
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));
        $payload = $this->base64UrlEncode(json_encode([
            'aud' => config('customer-auth.audience'),
            'exp' => $expiresAt,
            'iat' => $issuedAt,
            'iss' => config('app.url'),
            'jti' => (string) Str::uuid(),
            'nbf' => $issuedAt,
            'sub' => $customer->getKey(),
        ], JSON_THROW_ON_ERROR));
        $signature = $this->base64UrlEncode(hash_hmac(
            'sha256',
            "{$header}.{$payload}",
            $this->secret(),
            true,
        ));

        return "{$header}.{$payload}.{$signature}";
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    /**
     * @return array<string, mixed>|null
     */
    private function decodeJson(string $value): ?array
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);

        if ($decoded === false) {
            return null;
        }

        try {
            $json = json_decode($decoded, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return is_array($json) ? $json : null;
    }

    private function isValidIssuer(string $issuer): bool
    {
        $tokenIss = rtrim($issuer, '/');
        $appUrl = rtrim((string) config('app.url'), '/');

        if ($tokenIss === $appUrl) {
            return true;
        }

        // In local development, allow localhost and 127.0.0.1 interchangeably
        $tokenHost = parse_url($tokenIss, PHP_URL_HOST);
        $appHost = parse_url($appUrl, PHP_URL_HOST);

        if (in_array($tokenHost, ['localhost', '127.0.0.1'], true) && in_array($appHost, ['localhost', '127.0.0.1'], true)) {
            $tokenPort = parse_url($tokenIss, PHP_URL_PORT);
            $appPort = parse_url($appUrl, PHP_URL_PORT);

            return $tokenPort === $appPort;
        }

        return false;
    }

    private function secret(): string
    {
        return hash('sha256', (string) config('customer-auth.secret'), true);
    }
}
