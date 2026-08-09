<?php

namespace App\Mcp\Servers;

use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Public Server')]
#[Version('0.0.1')]
#[Instructions('This server exposes basic MCP capabilities for local development.')]
class PublicServer extends Server
{
    protected array $tools = [];

    protected array $resources = [];

    protected array $prompts = [];
}
