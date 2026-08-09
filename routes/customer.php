<?php

use App\Http\Controllers\Customer\CustomerStorefrontController;
use Illuminate\Support\Facades\Route;

Route::get('menu/katalog', [CustomerStorefrontController::class, 'menuCatalog'])->name('customer.menu-catalog');
Route::get('paket/katalog', [CustomerStorefrontController::class, 'packageCatalog'])->name('customer.package-catalog');
Route::get('menu/{menuItem}/detail', [CustomerStorefrontController::class, 'menuDetail'])->name('customer.menu-detail');
Route::get('paket/{package}/detail', [CustomerStorefrontController::class, 'packageDetail'])->name('customer.package-detail');
Route::get('checkout', [CustomerStorefrontController::class, 'checkout'])->name('customer.checkout');
Route::post('checkout', [CustomerStorefrontController::class, 'storeCheckout'])
    ->middleware('throttle:10,1')
    ->name('customer.checkout.store');
