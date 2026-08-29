<?php

use App\Http\Controllers\CustomerV2\CustomerAuthenticationController;
use App\Http\Controllers\CustomerV2\CustomerController;
use App\Http\Middleware\AuthenticateCustomer;
use Illuminate\Support\Facades\Route;

Route::get('search', [CustomerController::class, 'search'])->name('customerV2.search');
Route::get('menu-catalog', [CustomerController::class, 'menuCatalog'])->name('customerV2.menuCatalog');
Route::get('package', [CustomerController::class, 'packageCatalog'])->name('customerV2.packageCatalog');
Route::get('info', [CustomerController::class, 'info'])->name('customerV2.info');
Route::get('privacy-policy', [CustomerController::class, 'privacyPolicy'])->name('customerV2.privacyPolicy');
Route::get('terms-of-service', [CustomerController::class, 'termsOfService'])->name('customerV2.termsOfService');
Route::get('menu/{menuItem}/detail', [CustomerController::class, 'menuDetail'])->name('customerV2.menuDetail');
Route::get('package/{package}/detail', [CustomerController::class, 'packageDetail'])->name('customerV2.packageDetail');

Route::get('login/google/redirect', [CustomerAuthenticationController::class, 'googleRedirect'])
    ->name('customerV2.login.google.redirect');
Route::match(['get', 'post'], 'login/google/callback', [CustomerAuthenticationController::class, 'googleCallback'])
    ->middleware('throttle:customer-google-login')
    ->name('customerV2.login.google.callback');
Route::post('login/google', [CustomerAuthenticationController::class, 'store'])
    ->middleware('throttle:customer-google-login')
    ->name('customerV2.login.google');
Route::post('customer/logout', [CustomerAuthenticationController::class, 'destroy'])
    ->name('customerV2.logout');

Route::middleware(AuthenticateCustomer::class)->group(function (): void {
    Route::get('orders', [CustomerController::class, 'orders'])->name('customerV2.orders');
    Route::get('checkout', [CustomerController::class, 'checkout'])->name('customerV2.checkout');
    Route::post('checkout', [CustomerController::class, 'storeCheckout'])
        ->middleware('throttle:customer-checkout')
        ->name('customerV2.storeCheckout');
});
