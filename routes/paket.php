<?php

use App\Http\Controllers\Paket\PackageController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(PackageController::class)
        ->prefix('paket')
        ->name('paket.')
        ->group(function (): void {
            Route::get('export', 'export')->name('export');
            Route::post('images/temp', 'temporaryImage')->name('images.temp.store');
            Route::post('reorder', 'reorder')->name('reorder');
            Route::patch('{package}/status', 'status')->name('status');
        });

    Route::resource('paket', PackageController::class)
        ->parameters([
            'paket' => 'package',
        ]);

});
