<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Fortify\Features;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set([
            'cloudinary.cloud_name' => 'test-cloud',
            'cloudinary.api_key' => 'test-key',
            'cloudinary.api_secret' => 'test-secret',
        ]);
    }

    protected function fakeCloudinary(): void
    {
        $uploadNumber = 0;

        Http::fake(function (Request $request) use (&$uploadNumber) {
            $uploadNumber++;
            $publicId = "test/media/{$uploadNumber}";

            return Http::response([
                'public_id' => $publicId,
                'secure_url' => "https://res.cloudinary.com/test-cloud/image/upload/{$publicId}.jpg",
                'version' => $uploadNumber,
                'result' => 'ok',
            ]);
        });
    }

    protected function skipUnlessFortifyHas(string $feature, ?string $message = null): void
    {
        if (! Features::enabled($feature)) {
            $this->markTestSkipped($message ?? "Fortify feature [{$feature}] is not enabled.");
        }
    }
}
