<?php

namespace App\Http\Controllers\Schedule;

use App\Actions\Admin\Schedule\ScheduleAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function __invoke(Request $request, ScheduleAction $schedules): Response
    {
        return Inertia::render('admin/schedules/index', [
            'items' => $schedules->index($request->query()),
            'activityItems' => $schedules->upcomingActivityItems(),
            'calendarDays' => $schedules->calendarDays($request->query()),
            'filters' => $schedules->normalizeFilters($request->query()),
            'stats' => $schedules->stats(),
        ]);
    }
}
