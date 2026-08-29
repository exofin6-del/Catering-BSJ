<?php

use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\Report\ReportExportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('laporan', ReportController::class)->name('report.index');
    Route::get('laporan/penjualan', [ReportController::class, 'penjualan'])->name('report.sales');
    Route::get('laporan/ekspor', ReportExportController::class)->name('report.export');
});
