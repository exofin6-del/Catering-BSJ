<?php

namespace Tests\Feature;

use Tests\TestCase;

class GeolocationPermissionPolicyTest extends TestCase
{
    public function test_web_responses_allow_geolocation_for_the_current_origin(): void
    {
        $response = $this->get('/');

        $response->assertHeader('Permissions-Policy', 'geolocation=(self)');
    }
}
