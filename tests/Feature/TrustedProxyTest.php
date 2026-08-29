<?php

namespace Tests\Feature;

use Tests\TestCase;

class TrustedProxyTest extends TestCase
{
    public function test_redirects_use_the_forwarded_https_scheme(): void
    {
        $response = $this->get('/admin/kategori', [
            'X-Forwarded-Proto' => 'https',
        ]);

        $response->assertRedirect();
        $this->assertStringStartsWith(
            'https://',
            (string) $response->headers->get('Location'),
        );
    }
}
