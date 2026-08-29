<?php

namespace App\Http\Middleware;

use App\Models\Customer;
use App\Services\CustomerJwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateCustomer
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function __construct(
        private readonly CustomerJwtService $jwt,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $claims = $this->jwt->claims((string) $request->cookie(config('customer-auth.cookie')));
        $customer = $claims === null
            ? null
            : Customer::query()->find($claims['customer_id']);

        if (! $customer instanceof Customer) {
            return redirect()
                ->guest(route('home'))
                ->withoutCookie((string) config('customer-auth.cookie'));
        }

        $request->setUserResolver(fn (): Customer => $customer);

        return $next($request);
    }
}
