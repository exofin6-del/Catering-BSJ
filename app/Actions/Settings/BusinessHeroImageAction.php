<?php

namespace App\Actions\Settings;

use App\Models\BusinessSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BusinessHeroImageAction
{
    public function store(BusinessSetting $setting, UploadedFile $file, int $index): string
    {
        $path = $file->store('business/hero', 'public');

        return '/storage/'.$path;
    }

    public function delete(BusinessSetting $setting, int $index): void
    {
        $images = $setting->hero_images ?? [];

        if (! isset($images[$index])) {
            return;
        }

        $imageUrl = $images[$index];
        $path = parse_url($imageUrl, PHP_URL_PATH);
        if ($path) {
            $relativePath = str_replace('/storage/', '', $path);
            Storage::disk('public')->delete($relativePath);
        }
    }

    public function deleteAll(BusinessSetting $setting): void
    {
        $images = $setting->hero_images ?? [];

        foreach ($images as $imageUrl) {
            $path = parse_url($imageUrl, PHP_URL_PATH);
            if ($path) {
                $relativePath = str_replace('/storage/', '', $path);
                Storage::disk('public')->delete($relativePath);
            }
        }
    }
}
