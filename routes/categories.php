<?php

use App\Http\Controllers\Category\CategoryController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->controller(CategoryController::class)
    ->prefix('kategori')
    ->name('categories.')
    ->group(function (): void {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::post('reorder', 'reorder')->name('reorder');
        Route::get('{type}/{category}/edit', 'edit')->whereIn('type', ['menu', 'paket'])->name('edit');
        Route::put('{type}/{category}', 'update')->whereIn('type', ['menu', 'paket'])->name('update');
        Route::patch('{type}/{category}/status', 'status')->whereIn('type', ['menu', 'paket'])->name('status');
        Route::delete('{type}/{category}', 'destroy')->whereIn('type', ['menu', 'paket'])->name('destroy');
    });
