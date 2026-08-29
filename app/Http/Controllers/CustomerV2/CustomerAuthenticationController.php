<?php

namespace App\Http\Controllers\CustomerV2;

use App\Actions\Customer\AuthenticateCustomerWithGoogleAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\AuthenticateCustomerWithGoogleRequest;
use App\Services\GoogleIdTokenVerifier;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthenticationController extends Controller
{
    /**
     * Google OAuth authorisation endpoint that hosts the account chooser.
     *
     * Using the hybrid `response_type=id_token` flow keeps the existing
     * ID-token verification pipeline while giving users the full-page
     * account picker instead of the browser-dependent FedCM prompt.
     */
    private const GoogleOauthEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

    public function create(): Response
    {
        return Inertia::render('customersV2/login', [
            'googleClientId' => config('services.google.client_id'),
        ]);
    }

    /**
     * Redirect the customer to Google's account chooser.
     *
     * A signed `state` and a `nonce` (embedded into the returned ID token)
     * are bound to the session so the callback cannot be replayed or forged.
     */
    public function googleRedirect(Request $request): RedirectResponse
    {
        $clientId = (string) config('services.google.client_id');

        if ($clientId === '') {
            return redirect()
                ->route('home')
                ->withErrors(['credential' => __('Google sign-in is not configured.')]);
        }

        $previousUrl = url()->previous();
        if ($previousUrl !== '' && ! str_contains($previousUrl, '/login/google')) {
            $request->session()->put('url.intended', $previousUrl);
        }

        $state = Crypt::encryptString('customer-google-login|'.now()->timestamp);
        $nonce = bin2hex(random_bytes(16));

        $request->session()->put('google_login_nonce', $nonce);

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => route('customerV2.login.google.callback'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return redirect()->away(self::GoogleOauthEndpoint.'?'.$query);
    }

    public function store(
        AuthenticateCustomerWithGoogleRequest $request,
        AuthenticateCustomerWithGoogleAction $authenticate,
    ): RedirectResponse {
        if (! $this->hasValidGoogleLoginState($request, $request->validated('state'))) {
            Log::warning('Google login state invalid', [
                'state' => $request->validated('state'),
                'session_nonce' => $request->session()->get('google_login_nonce'),
            ]);

            return redirect()
                ->route('home')
                ->withErrors(['credential' => __('Google sign-in session expired. Please try again.')]);
        }

        $credential = $request->validated('credential');
        $code = $request->validated('code');

        if (is_string($code) && $code !== '') {
            $credential = app(GoogleIdTokenVerifier::class)->exchangeCodeForIdToken(
                $code,
                route('customerV2.login.google.callback'),
            );
        }

        if (! is_string($credential) || $credential === '') {
            return redirect()
                ->route('home')
                ->withErrors(['credential' => __('Google sign-in could not be verified.')]);
        }

        $this->assertGoogleLoginNonce($request, $authenticate, $credential);

        $authentication = $authenticate->handle($credential);

        $request->session()->forget('google_login_nonce');

        return redirect()
            ->intended(route('home'))
            ->withCookie(cookie(
                name: (string) config('customer-auth.cookie'),
                value: $authentication['token'],
                minutes: (int) config('customer-auth.lifetime'),
                path: '/',
                secure: app()->isProduction(),
                httpOnly: true,
                raw: false,
                sameSite: 'lax',
            ));
    }

    /**
     * Receive the ID token or OAuth authorization code back after
     * Google redirected the browser, then delegate to the same store flow.
     */
    public function googleCallback(
        AuthenticateCustomerWithGoogleRequest $request,
        AuthenticateCustomerWithGoogleAction $authenticate,
    ): RedirectResponse {
        return $this->store($request, $authenticate);
    }

    /**
     * Validate the encrypted anti-forgery state value issued for this flow.
     */
    private function hasValidGoogleLoginState(Request $request, string $state): bool
    {
        try {
            $payload = Crypt::decryptString($state);
        } catch (DecryptException) {
            return false;
        }

        if (! str_starts_with($payload, 'customer-google-login|')) {
            return false;
        }

        $issuedAt = (int) str_replace('customer-google-login|', '', $payload);

        return $issuedAt > 0 && (now()->timestamp - $issuedAt) <= 600;
    }

    /**
     * Bind the returned ID token to the nonce issued when the flow started,
     * proving the response belongs to this browser session.
     */
    private function assertGoogleLoginNonce(
        Request $request,
        AuthenticateCustomerWithGoogleAction $authenticate,
        string $credential,
    ): void {
        $expectedNonce = (string) $request->session()->pull('google_login_nonce');

        $tokenClaims = $authenticate->decodeIdTokenPayload($credential);

        $nonce = is_array($tokenClaims) ? ($tokenClaims['nonce'] ?? null) : null;

        if ($expectedNonce !== '' && is_string($nonce) && ! hash_equals($expectedNonce, $nonce)) {
            Log::warning('Google login nonce mismatch', [
                'expected_nonce' => $expectedNonce,
                'token_nonce' => $nonce,
            ]);

            throw ValidationException::withMessages([
                'credential' => __('Google sign-in could not be verified.'),
            ]);
        }
    }

    public function destroy(Request $request): RedirectResponse
    {
        return redirect()
            ->route('home')
            ->withoutCookie((string) config('customer-auth.cookie'));
    }
}
