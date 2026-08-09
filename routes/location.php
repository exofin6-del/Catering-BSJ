<?php

use App\Http\Controllers\Location\NearbyLocationController;
use Illuminate\Support\Facades\Route;

Route::get('locations/nearby', NearbyLocationController::class)
    ->middleware('throttle:30,1')
    ->name('locations.nearby');
