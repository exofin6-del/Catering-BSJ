<?php

namespace Tests\Unit;

use App\Services\CloudinaryService;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CloudinaryServiceTest extends TestCase
{
    public function test_upload_uses_a_signed_request_and_optimized_delivery_url(): void
    {
        $capturedRequest = null;

        Http::fake(function (Request $request) use (&$capturedRequest) {
            $capturedRequest = $request;

            return Http::response([
                'public_id' => 'catering/menu/items/1/example',
                'secure_url' => 'https://res.cloudinary.com/test-cloud/image/upload/v1/catering/menu/items/1/example.jpg',
                'version' => 1,
            ]);
        });

        $asset = app(CloudinaryService::class)->upload(
            UploadedFile::fake()->image('menu.jpg'),
            'catering/menu/items/1',
        );

        $this->assertInstanceOf(Request::class, $capturedRequest);
        $payload = collect($capturedRequest->data())
            ->mapWithKeys(fn (array $part): array => [$part['name'] => $part['contents']])
            ->all();
        $signatureParameters = [
            'public_id' => $payload['public_id'],
            'timestamp' => (int) $payload['timestamp'],
        ];
        ksort($signatureParameters);

        $this->assertSame(
            sha1(http_build_query($signatureParameters, '', '&', PHP_QUERY_RFC3986).'test-secret'),
            $payload['signature'],
        );
        $this->assertSame('test-key', $payload['api_key']);
        $this->assertStringContainsString(
            '/image/upload/f_auto,q_auto,c_limit,w_1920/',
            $asset['secure_url'],
        );
    }
}
