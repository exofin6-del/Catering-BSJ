<?php

namespace App\Actions\Paket;

use App\Models\PackageImage;
use App\Services\CloudinaryService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PackageImageAction
{
    private const TemporarySessionKey = 'packages.temporary_images';

    public function __construct(private readonly CloudinaryService $cloudinary) {}

    public function upload(
        UploadedFile $file,
        int $packageId,
        bool $isPrimary = false,
    ): PackageImage {
        $asset = $this->cloudinary->upload($file, "catering/packages/{$packageId}");

        return $this->createFromAsset($asset, $packageId, $isPrimary);
    }

    /**
     * @return array{id: string, name: string, url: string}
     */
    public function temporaryUpload(UploadedFile $file): array
    {
        $id = (string) Str::uuid();
        $asset = $this->cloudinary->upload($file, 'catering/packages/temp');
        $temporaryImages = session(self::TemporarySessionKey, []);

        $temporaryImages[$id] = [
            'name' => $file->getClientOriginalName(),
            'public_id' => $asset['public_id'],
            'url' => $asset['secure_url'],
        ];

        session([self::TemporarySessionKey => $temporaryImages]);

        return [
            'id' => $id,
            'name' => $temporaryImages[$id]['name'],
            'url' => $temporaryImages[$id]['url'],
        ];
    }

    public function promoteTemporaryUpload(
        string $temporaryImageId,
        int $packageId,
        bool $isPrimary = false,
    ): ?PackageImage {
        $temporaryImages = session(self::TemporarySessionKey, []);
        $temporaryImage = Arr::get($temporaryImages, $temporaryImageId);

        if (! is_array($temporaryImage) || ! is_string($temporaryImage['public_id'] ?? null)) {
            return null;
        }

        $publicId = (string) $temporaryImage['public_id'];
        $asset = $this->cloudinary->rename(
            $publicId,
            "catering/packages/{$packageId}/".Str::afterLast($publicId, '/'),
        );

        Arr::forget($temporaryImages, $temporaryImageId);
        session([self::TemporarySessionKey => $temporaryImages]);

        return $this->createFromAsset($asset, $packageId, $isPrimary);
    }

    public function setPrimary(PackageImage $image): void
    {
        PackageImage::query()
            ->where('package_id', $image->package_id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);
    }

    public function delete(PackageImage $image): void
    {
        $wasPrimary = $image->is_primary;
        $packageId = $image->package_id;

        if (filled($image->cloudinary_public_id)) {
            $this->cloudinary->destroy((string) $image->cloudinary_public_id);
        } else {
            $this->deleteLegacyFile($image->image_url);
        }

        $image->delete();

        if (! $wasPrimary) {
            return;
        }

        $nextImage = PackageImage::query()
            ->where('package_id', $packageId)
            ->orderBy('sort_order')
            ->first();

        $nextImage?->update(['is_primary' => true]);
    }

    /**
     * @param  array{public_id: string, secure_url: string, version: int|null}  $asset
     */
    private function createFromAsset(array $asset, int $packageId, bool $isPrimary = false): PackageImage
    {
        $aggregate = PackageImage::query()
            ->where('package_id', $packageId)
            ->selectRaw('COUNT(*) as total, MAX(sort_order) as max_sort')
            ->first();

        $hasExisting = $aggregate->total > 0;
        $nextSortOrder = ((int) $aggregate->max_sort) + 1;
        $shouldPrimary = $isPrimary || ! $hasExisting;

        if ($shouldPrimary && $hasExisting) {
            PackageImage::query()
                ->where('package_id', $packageId)
                ->update(['is_primary' => false]);
        }

        return PackageImage::create([
            'package_id' => $packageId,
            'image_url' => $asset['secure_url'],
            'cloudinary_public_id' => $asset['public_id'],
            'is_primary' => $shouldPrimary,
            'sort_order' => $nextSortOrder,
        ]);
    }

    private function deleteLegacyFile(?string $url): void
    {
        $path = parse_url((string) $url, PHP_URL_PATH);

        if (is_string($path)) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $path));
        }
    }
}
