<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageCompressionService
{
    private ImageManager $manager;

    public function __construct()
    {
        // Intervention Image 4.x requires a driver in constructor
        $this->manager = new ImageManager(new Driver());
    }

    /**
     * Compress image while maintaining reasonable quality and resolution
     *
     * @param UploadedFile $file
     * @param int $maxWidth Maximum width in pixels (default 1920px)
     * @param int $maxHeight Maximum height in pixels (default 1920px)
     * @param int $quality JPEG/WebP quality (1-100, default 85)
     * @return string Path to compressed image
     */
    public function compress(UploadedFile $file, int $maxWidth = 1920, int $maxHeight = 1920, int $quality = 85): string
    {
        $image = $this->manager->decodePath($file->getPathname());

        // Calculate new dimensions maintaining aspect ratio
        $originalWidth = $image->width();
        $originalHeight = $image->height();

        if ($originalWidth > $maxWidth || $originalHeight > $maxHeight) {
            $image->scaleDown($maxWidth, $maxHeight);
        }

        // Generate temporary path for compressed image
        $tempPath = sys_get_temp_dir() . '/' . uniqid() . '.' . $file->getClientOriginalExtension();

        // Save with compression
        $image->save($tempPath, $quality);

        return $tempPath;
    }

    /**
     * Compress image and return as UploadedFile instance
     *
     * @param UploadedFile $file
     * @param int $maxWidth
     * @param int $maxHeight
     * @param int $quality
     * @return UploadedFile
     */
    public function compressAsUploadedFile(UploadedFile $file, int $maxWidth = 1920, int $maxHeight = 1920, int $quality = 85): UploadedFile
    {
        $compressedPath = $this->compress($file, $maxWidth, $maxHeight, $quality);

        return new \Illuminate\Http\UploadedFile(
            $compressedPath,
            $file->getClientOriginalName(),
            $file->getClientMimeType(),
            null,
            true // Mark as test file to avoid validation issues
        );
    }

    /**
     * Compress image and store directly to disk
     *
     * @param UploadedFile $file
     * @param string $folder
     * @param string $disk
     * @param int $maxWidth
     * @param int $maxHeight
     * @param int $quality
     * @return string Stored path
     */
    public function compressAndStore(UploadedFile $file, string $folder, string $disk = 'public', int $maxWidth = 1920, int $maxHeight = 1920, int $quality = 85): string
    {
        $compressedPath = $this->compress($file, $maxWidth, $maxHeight, $quality);

        // Store the compressed file with a unique name to avoid collisions
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $destination = $folder . '/' . $filename;

        Storage::disk($disk)->put($destination, file_get_contents($compressedPath));

        // Clean up temporary file
        @unlink($compressedPath);

        return $destination;
    }

    /**
     * Get file size after compression (in MB)
     *
     * @param UploadedFile $file
     * @param int $maxWidth
     * @param int $maxHeight
     * @param int $quality
     * @return float
     */
    public function estimateCompressedSize(UploadedFile $file, int $maxWidth = 1920, int $maxHeight = 1920, int $quality = 85): float
    {
        $compressedPath = $this->compress($file, $maxWidth, $maxHeight, $quality);
        $size = filesize($compressedPath);
        @unlink($compressedPath);

        return round($size / 1024 / 1024, 2);
    }
}