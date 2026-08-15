<?php

namespace App\Actions\Settings;

use App\CustomerTheme;
use App\Models\BusinessSetting;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BusinessSettingsAction
{
    public function __construct(
        private readonly BusinessHeroImageAction $heroImageAction,
        private readonly CloudinaryService $cloudinary,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function forPage(): array
    {
        return $this->serialize($this->setting());
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(array $data): BusinessSetting
    {
        $setting = $this->setting();

        if (empty($data['business_lat'])) {
            $data['business_lat'] = null;
        }

        if (empty($data['business_lng'])) {
            $data['business_lng'] = null;
        }

        if (empty($data['business_address'])) {
            $data['business_address'] = null;
        }

        if (isset($data['logo']) && $data['logo'] instanceof UploadedFile) {
            $this->handleLogoUpload($setting, $data['logo']);
            unset($data['logo']);
        }

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
        $existingPublicIds = $setting->hero_image_cloudinary_public_ids ?? [];
        $heroImages = [];
        $heroPublicIds = [];

        for ($i = 0; $i < 3; $i++) {
            $imageUrl = $existingImages[$i] ?? null;
            $publicId = $existingPublicIds[$i] ?? null;
            $removeKey = "remove_hero_image_{$i}";
            $uploadKey = "hero_image_{$i}";

            if (! empty($data[$removeKey])) {
                $this->heroImageAction->delete($setting, $i);
                $imageUrl = null;
                $publicId = null;
            }

            if (isset($data[$uploadKey]) && $data[$uploadKey] instanceof UploadedFile) {
                $this->heroImageAction->delete($setting, $i);
                $asset = $this->heroImageAction->store($setting, $data[$uploadKey], $i);
                $imageUrl = $asset['url'];
                $publicId = $asset['public_id'];
            }

            if (filled($imageUrl)) {
                $heroImages[] = $imageUrl;
                $heroPublicIds[] = filled($publicId) ? $publicId : null;
            }

            unset($data[$removeKey], $data[$uploadKey]);
        }

        $data['hero_images'] = $heroImages;
        $data['hero_image_cloudinary_public_ids'] = $heroPublicIds;

        return $data;
    }

    private function handleLogoUpload(BusinessSetting $setting, UploadedFile $logo): void
    {
        if (filled($setting->logo_cloudinary_public_id)) {
            $this->cloudinary->destroy((string) $setting->logo_cloudinary_public_id);
        } else {
            $this->deleteLegacyFile($setting->logo);
        }

        $asset = $this->cloudinary->upload($logo, 'catering/business/logo');

        $setting->update([
            'logo' => $asset['secure_url'],
            'logo_cloudinary_public_id' => $asset['public_id'],
        ]);
    }

    private function setting(): BusinessSetting
    {
        return BusinessSetting::query()->firstOrCreate();
    }

    private function deleteLegacyFile(?string $url): void
    {
        $path = parse_url((string) $url, PHP_URL_PATH);

        if (is_string($path)) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $path));
        }
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
