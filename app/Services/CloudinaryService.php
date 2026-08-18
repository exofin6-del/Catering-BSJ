<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class CloudinaryService
{
    /**
     * Upload an image and return its Cloudinary delivery metadata.
     *
     * @return array{public_id: string, secure_url: string, version: int|null}
     */
    public function upload(UploadedFile $file, string $folder): array
    {
        $this->ensureConfigured();

        $publicId = trim($folder, '/').'/'.Str::lower((string) Str::uuid());
        $timestamp = now()->timestamp;
        $stream = fopen($file->getRealPath(), 'rb');

        if ($stream === false) {
            throw new RuntimeException('File gambar tidak dapat dibaca.');
        }

        try {
            return $this->assetFromResponse($this->request(
                action: 'image/upload',
                parameters: [
                    'public_id' => $publicId,
                    'timestamp' => $timestamp,
                ],
                stream: $stream,
                filename: $file->getClientOriginalName(),
            ));
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }
    }

    /**
     * Move a temporary upload to its permanent folder without downloading it.
     *
     * @return array{public_id: string, secure_url: string, version: int|null}
     */
    public function rename(string $fromPublicId, string $toPublicId): array
    {
        $this->ensureConfigured();

        return $this->assetFromResponse($this->request(
            action: 'image/rename',
            parameters: [
                'from_public_id' => $fromPublicId,
                'overwrite' => 'false',
                'timestamp' => now()->timestamp,
                'to_public_id' => $toPublicId,
            ],
        ));
    }

    public function destroy(string $publicId): void
    {
        $this->ensureConfigured();

        $this->request(
            action: 'image/destroy',
            parameters: [
                'invalidate' => 'true',
                'public_id' => $publicId,
                'timestamp' => now()->timestamp,
            ],
        );
    }

    /**
     * @param  array<string, string|int>  $parameters
     * @param  resource|null  $stream
     * @return array<string, mixed>
     */
    private function request(
        string $action,
        array $parameters,
        mixed $stream = null,
        ?string $filename = null,
    ): array {
        $body = [
            ...$parameters,
            'api_key' => (string) config('cloudinary.api_key'),
            'signature' => $this->signature($parameters),
        ];

        $request = Http::timeout((int) config('cloudinary.timeout', 30))
            ->connectTimeout((int) config('cloudinary.connect_timeout', 10))
            ->retry(2, 250, throw: false);

        if (is_resource($stream)) {
            $request = $request->attach('file', $stream, $filename ?? 'image');
        }

        $response = $request->post($this->endpoint($action), $body);

        if ($response->failed()) {
            $message = $response->json('error.message')
                ?? $response->body()
                ?: 'Upload gambar ke Cloudinary gagal.';

            throw new RuntimeException((string) $message);
        }

        return $response->json();
    }

    private function endpoint(string $action): string
    {
        return sprintf(
            'https://api.cloudinary.com/v1_1/%s/%s',
            config('cloudinary.cloud_name'),
            $action,
        );
    }

    /**
     * @param  array<string, string|int>  $parameters
     */
    private function signature(array $parameters): string
    {
        ksort($parameters);

        $toSign = collect($parameters)
            ->map(static fn (string|int $value, string $key): string => $key.'='.$value)
            ->implode('&');

        return sha1($toSign.(string) config('cloudinary.api_secret'));
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array{public_id: string, secure_url: string, version: int|null}
     */
    private function assetFromResponse(array $response): array
    {
        $publicId = $response['public_id'] ?? null;

        if (! is_string($publicId) || $publicId === '') {
            throw new RuntimeException('Cloudinary tidak mengembalikan public_id gambar.');
        }

        $secureUrl = $response['secure_url'] ?? null;

        if (! is_string($secureUrl) || $secureUrl === '') {
            $version = isset($response['version']) ? (int) $response['version'] : null;
            $versionPath = $version ? "v{$version}/" : '';
            $secureUrl = sprintf(
                'https://res.cloudinary.com/%s/image/upload/%s%s',
                config('cloudinary.cloud_name'),
                $versionPath,
                $publicId,
            );
        }

        return [
            'public_id' => $publicId,
            'secure_url' => $this->optimizedUrl($secureUrl),
            'version' => isset($response['version']) ? (int) $response['version'] : null,
        ];
    }

    private function optimizedUrl(string $url): string
    {
        return str_replace(
            '/image/upload/',
            '/image/upload/f_auto,q_auto,c_limit,w_1920/',
            $url,
        );
    }

    private function ensureConfigured(): void
    {
        if (filled(config('cloudinary.cloud_name'))
            && filled(config('cloudinary.api_key'))
            && filled(config('cloudinary.api_secret'))) {
            return;
        }

        throw new RuntimeException('Cloudinary belum dikonfigurasi. Isi CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, dan CLOUDINARY_API_SECRET di file .env.');
    }
}
