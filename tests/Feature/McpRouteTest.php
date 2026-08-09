<?php

namespace Tests\Feature;

use Tests\TestCase;

class McpRouteTest extends TestCase
{
    public function test_mcp_http_endpoint_accepts_post_requests_only(): void
    {
        $this->get('/mcp')
            ->assertStatus(405)
            ->assertHeader('Allow', 'POST');

        $this->delete('/mcp')
            ->assertStatus(405)
            ->assertHeader('Allow', 'POST');
    }
}
