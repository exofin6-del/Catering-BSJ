<?php

namespace App\Actions\Admin\Menu;

class MenuItemExport
{
    public function __construct(
        private readonly MenuItemIndex $menuItems,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array<int, array<string, mixed>>
     */
    public function handle(array $filters): array
    {
        return $this->menuItems->listAll($filters);
    }
}
