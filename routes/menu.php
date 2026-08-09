<?php

use App\Http\Controllers\Menu\MenuController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::controller(MenuController::class)
        ->prefix('menu')
        ->name('menu.')
        ->group(function (): void {
            Route::get('export', 'export')->name('export');
            Route::post('images/temp', 'temporaryImage')->name('images.temp.store');
            Route::post('reorder', 'reorder')->name('reorder');
            Route::patch('{menuItem}/status', 'status')->name('status');
        });

    Route::resource('menu', MenuController::class)
        ->parameters([
            'menu' => 'menuItem',
        ]);

});
