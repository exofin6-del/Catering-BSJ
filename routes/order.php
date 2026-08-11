<?php

use App\Http\Controllers\Order\OrderController;
use App\Http\Controllers\Order\OrderPaymentController;
use Illuminate\Support\Facades\Route;

// Public routes (no auth required)
Route::get('order/calendar-capacity', [OrderController::class, 'calendarCapacity'])->name('order.calendar-capacity');

// Protected routes (auth required)
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::controller(OrderController::class)
        ->prefix('order')
        ->name('order.')
        ->group(function (): void {
            Route::get('catalog', 'catalog')->name('catalog');
            Route::get('export', 'export')->name('export');
            Route::get('{order}/accept', 'acceptPage')->name('acceptPage');
            Route::post('{order}/accept', 'accept')->name('accept');
            Route::get('{order}/pay', 'payPage')->name('payPage');
            Route::get('{order}/receipt', 'receipt')->name('receipt');
            Route::patch('{order}/status', 'status')->name('status');
        });

    Route::resource('order.payments', OrderPaymentController::class)
        ->only(['create', 'store']);

    Route::resource('order', OrderController::class)
        ->parameters([
            'order' => 'order',
        ]);
});
