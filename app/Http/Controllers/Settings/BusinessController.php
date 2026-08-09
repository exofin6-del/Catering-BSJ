<?php

namespace App\Http\Controllers\Settings;

use App\Actions\Settings\BusinessSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateBusinessSettingRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BusinessController extends Controller
{
    public function __construct(
        private readonly BusinessSettingsAction $settings,
    ) {}

    public function edit(): Response
    {
        return Inertia::render('settings/business', [
            'businessSetting' => $this->settings->forPage(),
        ]);
    }

    public function update(UpdateBusinessSettingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // Ensure file uploads are included in data since $request->validated()
        // may not include them reliably when using _method spoofing with FormData.

        for ($i = 0; $i < 3; $i++) {
            $key = "hero_image_{$i}";
            if ($request->hasFile($key)) {
                $data[$key] = $request->file($key);
            }
        }

        $this->settings->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Pengaturan bisnis berhasil disimpan.')]);

        return to_route('business.edit');
    }
}
