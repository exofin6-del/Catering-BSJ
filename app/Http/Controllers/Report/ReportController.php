<?php

namespace App\Http\Controllers\Report;

use App\Actions\Report\ReportAction;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __invoke(Request $request, ReportAction $reports): Response
    {
        return Inertia::render('admin/reports/index', $reports->getReportData($this->filters($request)));
    }

    public function penjualan(Request $request, ReportAction $reports): Response
    {
        return Inertia::render('admin/reports/sales', $reports->getReportData($this->filters($request)));
    }

    /**
     * @return array{period?: string, start_date?: string|null, end_date?: string|null}
     */
    private function filters(Request $request): array
    {
        return $request->validate([
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'period' => ['nullable', Rule::in(['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'])],
            'start_date' => ['nullable', 'date'],
        ]);
    }
}
