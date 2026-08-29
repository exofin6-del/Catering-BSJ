<?php

namespace Tests\Feature\Customer;

use App\Models\Customer;
use App\Services\CustomerJwtService;
use App\Services\GoogleIdTokenVerifier;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Mockery;
use Tests\TestCase;

class CustomerAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_requires_customer_authentication(): void
    {
        $this->get(route('customerV2.checkout'))
            ->assertRedirect(route('home'));
    }

    public function test_google_redirect_sends_the_customer_to_the_account_chooser(): void
    {
        config()->set('services.google.client_id', 'google-client-id');

        $response = $this->get(route('customerV2.login.google.redirect'));

        $response->assertRedirect();

        $target = $response->headers->get('Location');

        $this->assertStringStartsWith('https://accounts.google.com/o/oauth2/v2/auth', $target);

        parse_str((string) parse_url($target, PHP_URL_QUERY), $query);

        $this->assertSame('google-client-id', $query['client_id']);
        $this->assertSame('code', $query['response_type']);
        $this->assertSame('openid email profile', $query['scope']);
        $this->assertSame('select_account', $query['prompt']);
        $this->assertSame(route('customerV2.login.google.callback'), $query['redirect_uri']);
        $this->assertArrayHasKey('state', $query);
        $this->assertNotSame('', $query['state']);

        $this->assertTrue(session()->has('google_login_nonce'));
    }

    public function test_google_redirect_requires_a_configured_client_id(): void
    {
        config()->set('services.google.client_id', null);

        $this->get(route('customerV2.login.google.redirect'))
            ->assertRedirect(route('home'))
            ->assertSessionHasErrors('credential');

        $this->assertFalse(session()->has('google_login_nonce'));
    }

    public function test_google_authentication_issues_an_http_only_customer_jwt_cookie(): void
    {
        config()->set('services.google.client_id', 'google-client-id');

        $nonce = bin2hex(random_bytes(16));

        $credential = $this->forgeIdToken(['nonce' => $nonce]);

        $this->app->instance(GoogleIdTokenVerifier::class, Mockery::mock(GoogleIdTokenVerifier::class, function ($mock) use ($credential): void {
            $mock->shouldReceive('verify')
                ->once()
                ->with($credential)
                ->andReturn([
                    'google_id' => 'google-customer-123',
                    'name' => 'Budi Santoso',
                    'email' => 'budi@example.com',
                    'avatar' => 'https://example.com/budi.jpg',
                ]);
        }));

        $response = $this->withSession(['google_login_nonce' => $nonce])
            ->post(route('customerV2.login.google'), [
                'credential' => $credential,
                'state' => Crypt::encryptString('customer-google-login|'.now()->timestamp),
            ]);

        $response
            ->assertRedirect(route('home'))
            ->assertCookie((string) config('customer-auth.cookie'));

        $this->assertDatabaseHas('customers', [
            'google_id' => 'google-customer-123',
            'email' => 'budi@example.com',
        ]);

        $this->assertFalse(session()->has('google_login_nonce'));
    }

    public function test_google_authentication_rejects_a_stale_state(): void
    {
        config()->set('services.google.client_id', 'google-client-id');

        $nonce = bin2hex(random_bytes(16));

        $credential = $this->forgeIdToken(['nonce' => $nonce]);

        $response = $this->withSession(['google_login_nonce' => $nonce])
            ->post(route('customerV2.login.google'), [
                'credential' => $credential,
                'state' => Crypt::encryptString('customer-google-login|'.(now()->timestamp - 3600)),
            ]);

        $response->assertSessionHasErrors('credential');

        $this->assertDatabaseEmpty('customers');
        $this->assertGuest();
    }

    public function test_google_authentication_rejects_a_forged_state(): void
    {
        config()->set('services.google.client_id', 'google-client-id');

        $nonce = bin2hex(random_bytes(16));

        $credential = $this->forgeIdToken(['nonce' => $nonce]);

        $response = $this->withSession(['google_login_nonce' => $nonce])
            ->post(route('customerV2.login.google'), [
                'credential' => $credential,
                'state' => 'forged-state-value',
            ]);

        $response->assertSessionHasErrors('credential');

        $this->assertDatabaseEmpty('customers');
    }

    public function test_google_authentication_rejects_a_nonce_mismatch(): void
    {
        config()->set('services.google.client_id', 'google-client-id');

        $credential = $this->forgeIdToken(['nonce' => 'attacker-nonce']);

        $response = $this->withSession(['google_login_nonce' => 'session-nonce'])
            ->post(route('customerV2.login.google'), [
                'credential' => $credential,
                'state' => Crypt::encryptString('customer-google-login|'.now()->timestamp),
            ]);

        $response->assertSessionHasErrors('credential');

        $this->assertDatabaseEmpty('customers');
    }

    public function test_valid_customer_jwt_allows_checkout(): void
    {
        $customer = $this->createCustomer();
        $token = app(CustomerJwtService::class)->issue($customer);

        $this->withCookie((string) config('customer-auth.cookie'), $token)
            ->get(route('customerV2.checkout'))
            ->assertOk();
    }

    public function test_customer_logout_clears_the_jwt_cookie_and_redirects_home(): void
    {
        $customer = $this->createCustomer();
        $token = app(CustomerJwtService::class)->issue($customer);

        $this->withCookie((string) config('customer-auth.cookie'), $token)
            ->post(route('customerV2.logout'))
            ->assertRedirect(route('home'))
            ->assertCookieExpired((string) config('customer-auth.cookie'));
    }

    /**
     * Build an unsigned JWT-looking credential carrying the given claims.
     *
     * Only the payload structure matters here: nonce binding is read from
     * the payload, while signature/issuer checks live in the verifier,
     * which is mocked in these tests.
     *
     * @param  array<string, mixed>  $claims
     */
    private function forgeIdToken(array $claims): string
    {
        $encode = static function (array $payload): string {
            return rtrim(strtr(base64_encode((string) json_encode($payload)), '+/', '-_'), '=');
        };

        return $encode(['alg' => 'RS256', 'typ' => 'JWT']).'.'.$encode($claims).'.fake-signature';
    }

    private function createCustomer(): Customer
    {
        return Customer::query()->create([
            'google_id' => 'google-'.fake()->unique()->uuid(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
        ]);
    }
}
