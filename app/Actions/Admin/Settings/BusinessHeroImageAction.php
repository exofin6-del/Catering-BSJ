<?php

namespace App\Actions\Admin\Settings;

use App\Models\BusinessSetting;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class BusinessHeroImageAction
{
    public function __construct(private readonly CloudinaryService $cloudinary) {}

    /**
     * @return array{public_id: string, url: string}
     */
    public function store(BusinessSetting $setting, UploadedFile $file, int $index): array
    {
        $asset = $this->cloudinary->upload($file, "catering/business/hero/{$index}");

        return [
            'public_id' => $asset['public_id'],
            'url' => $asset['secure_url'],
        ];
    }

    public function delete(BusinessSetting $setting, int $index): void
    {
        $publicIds = $setting->hero_image_cloudinary_public_ids ?? [];
        $publicId = $publicIds[$index] ?? null;

        if (is_string($publicId) && $publicId !== '') {
            $this->cloudinary->destroy($publicId);

            return;
        }

        $images = $setting->hero_images ?? [];
        $this->deleteLegacyFile($images[$index] ?? null);
    }

    public function deleteAll(BusinessSetting $setting): void
    {
        $publicIds = $setting->hero_image_cloudinary_public_ids ?? [];
        $images = $setting->hero_images ?? [];

        foreach ($images as $index => $imageUrl) {
            $publicId = $publicIds[$index] ?? null;

            if (is_string($publicId) && $publicId !== '') {
                $this->cloudinary->destroy($publicId);
            } else {
                $this->deleteLegacyFile($imageUrl);
            }
        }
    }

    private function deleteLegacyFile(?string $url): void
    {
        $path = parse_url((string) $url, PHP_URL_PATH);

        if (is_string($path)) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $path));
        }
    }
}
