<?php

use App\Http\Controllers\CustomerV2\CustomerController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Customer Routes (public storefront)
|--------------------------------------------------------------------------
*/
Route::get('/', CustomerController::class)->name('home');

require __DIR__.'/customer/customerV2.php';

/*
|--------------------------------------------------------------------------
| Shared Public API
|--------------------------------------------------------------------------
*/
// Endpoint geolokasi publik yang dipakai bersama oleh sisi customer & admin.
require __DIR__.'/admin/location.php';

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function (): void {
    require __DIR__.'/admin/auth.php';

    Route::get('/', DashboardController::class)
        ->middleware(['auth', 'verified'])
        ->name('dashboard');

    require __DIR__.'/admin/order.php';
    require __DIR__.'/admin/paket.php';
    require __DIR__.'/admin/menu.php';
    require __DIR__.'/admin/categories.php';
    require __DIR__.'/admin/settings.php';
    require __DIR__.'/admin/report.php';
    require __DIR__.'/admin/schedule.php';
});
