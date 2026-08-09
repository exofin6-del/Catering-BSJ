<?php

use App\Http\Controllers\CustomerV2\CustomerController;
use Illuminate\Support\Facades\Route;


Route::get('search', [CustomerController::class, 'search'])->name('customerV2.search');
Route::get('menu-catalog', [CustomerController::class, 'menuCatalog'])->name('customerV2.menuCatalog');
Route::get('package', [CustomerController::class, 'packageCatalog'])->name('customerV2.packageCatalog');
Route::get('info', [CustomerController::class, 'info'])->name('customerV2.info');
Route::get('menu/{menuItem}/detail', [CustomerController::class, 'menuDetail'])->name('customerV2.menuDetail');
Route::get('package/{package}/detail', [CustomerController::class, 'packageDetail'])->name('customerV2.packageDetail');

Route::get('checkout', [CustomerController::class, 'checkout'])->name('customerV2.checkout');
Route::post('checkout', [CustomerController::class, 'storeCheckout'])->name('customerV2.storeCheckout');