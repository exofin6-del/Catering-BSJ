<?php

namespace App\Actions\Paket;

use App\Models\PackageImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PackageImageAction
{
    private const TemporarySessionKey = 'packages.temporary_images';

    public function upload(
        UploadedFile $file,
        int $packageId,
        bool $isPrimary = false,
    ): PackageImage {
        $folder = "packages/{$packageId}";
        $path = $file->store($folder, 'public');

        return $this->createFromStoredPath(
            path: $path,
            packageId: $packageId,
            isPrimary: $isPrimary,
        );
    }

    /**
     * @return array{id: string, name: string, url: string}
     */
    public function temporaryUpload(UploadedFile $file): array
    {
        $id = (string) Str::uuid();
        $path = $file->store('packages/temp', 'public');
        $temporaryImages = session(self::TemporarySessionKey, []);

        $temporaryImages[$id] = [
            'name' => $file->getClientOriginalName(),
            'path' => $path,
            'url' => Storage::url($path),
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

        if (! is_array($temporaryImage) || ! isset($temporaryImage['path'])) {
            return null;
        }

        $temporaryPath = (string) $temporaryImage['path'];
        $destinationPath = "packages/{$packageId}/".basename($temporaryPath);

        Storage::disk('public')->move($temporaryPath, $destinationPath);

        Arr::forget($temporaryImages, $temporaryImageId);
        session([self::TemporarySessionKey => $temporaryImages]);

        return $this->createFromStoredPath(
            path: $destinationPath,
            packageId: $packageId,
            isPrimary: $isPrimary,
        );
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

        Storage::disk('public')->delete(
            str_replace('/storage/', '', parse_url($image->image_url, PHP_URL_PATH) ?: '')
        );

        $image->delete();

        if (! $wasPrimary) {
            return;
        }

        $nextImage = PackageImage::query()
            ->where('package_id', $packageId)
            ->orderBy('sort_order')
            ->first();

        if ($nextImage instanceof PackageImage) {
            $nextImage->update(['is_primary' => true]);
        }
    }

    private function createFromStoredPath(
        string $path,
        int $packageId,
        bool $isPrimary = false,
    ): PackageImage {
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
            'image_url' => Storage::url($path),
            'is_primary' => $shouldPrimary,
            'sort_order' => $nextSortOrder,
        ]);
    }
}
