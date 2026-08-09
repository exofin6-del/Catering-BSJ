<?php

namespace App\Actions\Settings;

use App\CustomerTheme;
use App\Models\BusinessSetting;
use Illuminate\Http\UploadedFile;

class BusinessSettingsAction
{
    /**
     * @return array<string, mixed>
     */
    public function __construct(
        private readonly BusinessHeroImageAction $heroImageAction,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function forPage(): array
    {
        return $this->serialize($this->setting());
    }

    /**
     * @return array<string, mixed>
     */
    public function update(array $data): BusinessSetting
    {
        $setting = $this->setting();

        // Normalize empty location values to null so clearing the location
        // actually persists instead of turning into 0 due to decimal casts.
        if (empty($data['business_lat'])) {
            $data['business_lat'] = null;
        }

        if (empty($data['business_lng'])) {
            $data['business_lng'] = null;
        }

        if (empty($data['business_address'])) {
            $data['business_address'] = null;
        }

        // Handle hero image uploads
        $data = $this->handleHeroImages($setting, $data);

        $setting->fill($data);
        $setting->save();

        cache()->forget('business_setting_global');

        return $setting->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function handleHeroImages(BusinessSetting $setting, array $data): array
    {
        $existingImages = $setting->hero_images ?? [];
        $newImages = $existingImages;

        // Handle remove_hero_image_{index} flags
        for ($i = 0; $i < 3; $i++) {
            $removeKey = "remove_hero_image_{$i}";
            $uploadKey = "hero_image_{$i}";

            if (! empty($data[$removeKey])) {
                $this->heroImageAction->delete($setting, $i);
                $newImages[$i] = null;
            }

            if (isset($data[$uploadKey]) && $data[$uploadKey] instanceof UploadedFile) {
                $this->heroImageAction->delete($setting, $i);
                $newImages[$i] = $this->heroImageAction->store($setting, $data[$uploadKey], $i);
            }

            unset($data[$removeKey], $data[$uploadKey]);
        }

        // Clean up null entries and re-index
        $data['hero_images'] = array_values(array_filter($newImages));

        return $data;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */


    private function setting(): BusinessSetting
    {
        return BusinessSetting::query()->firstOrCreate();
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(BusinessSetting $setting): array
    {
        return [
            'business_name' => $setting->business_name,
            'description' => $setting->description,
            'whatsapp_number' => $setting->whatsapp_number,
            'business_lat' => $setting->business_lat,
            'business_lng' => $setting->business_lng,
            'business_address' => $setting->business_address,
            'max_order_km' => $setting->max_order_km,
            'max_orders_per_day' => $setting->max_orders_per_day,
            'operational_start_time' => $this->formatTime($setting->operational_start_time),
            'operational_end_time' => $this->formatTime($setting->operational_end_time),
            'is_open' => $setting->is_open,
            'customer_theme' => $setting->customer_theme ?: CustomerTheme::Minimal->value,
            'hero_images' => $setting->hero_images ?? [],
        ];
    }

    private function formatTime(mixed $value): string
    {
        return $value === null ? '' : substr((string) $value, 0, 5);
    }
}
