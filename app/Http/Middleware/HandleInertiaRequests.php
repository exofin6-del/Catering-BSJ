<?php

namespace App\Http\Middleware;

use App\Models\BusinessSetting;
use App\Models\Customer;
use App\Services\CustomerJwtService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    public function __construct(
        private readonly CustomerJwtService $customerJwt,
    ) {}

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $authenticatedUser = $request->user();

        if (! $authenticatedUser instanceof Customer) {
            $authenticatedUser = $this->resolveCustomerFromCookie($request) ?? $authenticatedUser;
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $authenticatedUser instanceof Customer
                    ? $authenticatedUser->only(['id', 'name', 'email', 'avatar', 'email_verified_at'])
                    : $authenticatedUser,
            ],
            'googleClientId' => config('services.google.client_id'),
            'business' => cache()->remember('business_setting_global', 3600, function () {
                $setting = BusinessSetting::query()->first();

                return $setting ? [
                    'business_name' => $setting->business_name,
                    'description' => $setting->description,
                    'whatsapp_number' => $setting->whatsapp_number,
                ] : [
                    'business_name' => 'Catering BSJ',
                    'description' => null,
                    'whatsapp_number' => null,
                ];
            }),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Resolve the authenticated storefront customer from the JWT cookie.
     *
     * Only considered outside the admin area and when no admin session is
     * present, so admin authentication is never overridden.
     */
    private function resolveCustomerFromCookie(Request $request): ?Customer
    {
        if ($request->is('admin/*') || $request->user() !== null) {
            return null;
        }

        $claims = $this->customerJwt->claims((string) $request->cookie(config('customer-auth.cookie')));

        if ($claims === null) {
            return null;
        }

        return Customer::query()->find($claims['customer_id']);
    }
}
