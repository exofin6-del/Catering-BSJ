<?php

namespace App\Providers;

use App\Services\CustomerJwtService;
use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    private function configureRateLimiting(): void
    {
        RateLimiter::for('customer-google-login', function (Request $request): Limit {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('customer-checkout', function (Request $request): array {
            $user = $request->user();
            $customerId = $user?->id;

            if ($customerId === null && $request->hasCookie((string) config('customer-auth.cookie'))) {
                $jwt = app(CustomerJwtService::class);
                $claims = $jwt->claims((string) $request->cookie(config('customer-auth.cookie')));
                $customerId = $claims['customer_id'] ?? null;
            }

            $customerKey = $customerId !== null ? 'customer:'.$customerId : 'anon:'.$request->ip();

            return [
                Limit::perMinute(5)->by('ip:'.$request->ip()),
                Limit::perDay(3)->by($customerKey),
            ];
        });
    }
}
