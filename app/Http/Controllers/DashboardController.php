<?php

namespace App\Http\Controllers;

use App\Actions\Admin\Dashboard\DashboardAction;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(DashboardAction $dashboard): Response
    {
        return Inertia::render('dashboard', $dashboard->pageProps());
    }
}
