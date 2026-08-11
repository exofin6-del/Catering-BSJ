<?php

namespace App\Actions\Menu;

use App\Models\MenuImage;
use App\Services\ImageCompressionService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MenuImageAction
{
    private const TemporarySessionKey = 'menu.temporary_images';

    public function __construct(private ImageCompressionService $compressor)
    {
    }

    public function upload(
        UploadedFile $file,
        int $menuItemId,
        bool $isPrimary = false,
    ): MenuImage {
        $folder = "menu/items/{$menuItemId}";

        // Compress image before storing
        $compressedPath = $this->compressor->compressAndStore(
            $file,
            $folder,
            'public',
            1920,
            1920,
            85
        );

        return $this->createFromStoredPath(
            path: $compressedPath,
            menuItemId: $menuItemId,
            isPrimary: $isPrimary,
        );
    }

    /**
     * @return array{id: string, name: string, url: string}
     */
    public function temporaryUpload(UploadedFile $file): array
    {
        $id = (string) Str::uuid();

        // Compress image before storing
        $compressedPath = $this->compressor->compressAndStore(
            $file,
            'menu/temp',
            'public',
            1920,
            1920,
            85
        );

        $temporaryImages = session(self::TemporarySessionKey, []);

        $temporaryImages[$id] = [
            'name' => $file->getClientOriginalName(),
            'path' => $compressedPath,
            'url' => Storage::url($compressedPath),
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
        int $menuItemId,
        bool $isPrimary = false,
    ): ?MenuImage {
        $temporaryImages = session(self::TemporarySessionKey, []);
        $temporaryImage = Arr::get($temporaryImages, $temporaryImageId);

        if (! is_array($temporaryImage) || ! isset($temporaryImage['path'])) {
            return null;
        }

        $temporaryPath = (string) $temporaryImage['path'];
        $destinationPath = "menu/items/{$menuItemId}/".basename($temporaryPath);

        Storage::disk('public')->move($temporaryPath, $destinationPath);

        Arr::forget($temporaryImages, $temporaryImageId);
        session([self::TemporarySessionKey => $temporaryImages]);

        return $this->createFromStoredPath(
            path: $destinationPath,
            menuItemId: $menuItemId,
            isPrimary: $isPrimary,
        );
    }

    private function createFromStoredPath(
        string $path,
        int $menuItemId,
        bool $isPrimary = false,
    ): MenuImage {
        $aggregate = MenuImage::query()
            ->where('menu_item_id', $menuItemId)
            ->selectRaw('COUNT(*) as total, MAX(sort_order) as max_sort')
            ->first();

        $hasExisting = $aggregate->total > 0;
        $nextSortOrder = ((int) $aggregate->max_sort) + 1;
        $shouldPrimary = $isPrimary || ! $hasExisting;

        if ($shouldPrimary && $hasExisting) {
            MenuImage::query()
                ->where('menu_item_id', $menuItemId)
                ->update(['is_primary' => false]);
        }

        return MenuImage::create([
            'menu_item_id' => $menuItemId,
            'image_url' => Storage::url($path),
            'is_primary' => $shouldPrimary,
            'sort_order' => $nextSortOrder,
        ]);
    }

    public function setPrimary(MenuImage $image): void
    {
        // Reset primary lama lalu set yang baru — 2 query dalam 1 transaksi implisit
        MenuImage::query()
            ->where('menu_item_id', $image->menu_item_id)
            ->update(['is_primary' => false]);

        $image->update(['is_primary' => true]);
    }

    public function delete(MenuImage $image): void
    {
        $wasPrimary = $image->is_primary;
        $itemId = $image->menu_item_id;

        // Hapus file dari storage
        Storage::disk('public')->delete(
            str_replace('/storage/', '', parse_url($image->image_url, PHP_URL_PATH))
        );

        $image->delete();

        // Promote gambar berikutnya jadi primary jika perlu
        if ($wasPrimary) {
            $nextImageId = MenuImage::query()
                ->where('menu_item_id', $itemId)
                ->orderBy('sort_order')
                ->value('id');

            if ($nextImageId) {
                $nextImage = MenuImage::find($nextImageId);
                if ($nextImage) {
                    $nextImage->update(['is_primary' => true]);
                }
            }
        }
    }
}
