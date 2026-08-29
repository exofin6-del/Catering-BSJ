<?php

namespace App\Actions\Customer;

use App\Models\Customer;
use App\Services\CustomerJwtService;
use App\Services\GoogleIdTokenVerifier;

class AuthenticateCustomerWithGoogleAction
{
    public function __construct(
        private readonly CustomerJwtService $jwt,
        private readonly GoogleIdTokenVerifier $googleIdTokenVerifier,
    ) {}

    /**
     * @return array{customer: Customer, token: string}
     */
    public function handle(string $credential): array
    {
        $identity = $this->googleIdTokenVerifier->verify($credential);

        $customer = Customer::query()->updateOrCreate(
            ['google_id' => $identity['google_id']],
            [
                'name' => $identity['name'],
                'email' => $identity['email'],
                'avatar' => $identity['avatar'],
                'email_verified_at' => now(),
            ],
        );

        return [
            'customer' => $customer,
            'token' => $this->jwt->issue($customer),
        ];
    }

    /**
     * Decode an ID token's payload without verifying it.
     *
     * Used to bind the nonce issued at flow start to the returned token;
     * the token itself is still fully verified by the verifier afterwards.
     *
     * @return array<string, mixed>|null
     */
    public function decodeIdTokenPayload(string $credential): ?array
    {
        $parts = explode('.', $credential);

        if (count($parts) !== 3) {
            return null;
        }

        $payload = json_decode((string) base64_decode(strtr($parts[1], '-_', '+/'), true), true);

        return is_array($payload) ? $payload : null;
    }
}
