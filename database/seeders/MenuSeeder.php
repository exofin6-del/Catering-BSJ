<?php

namespace Database\Seeders;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $user = User::query()->firstOrCreate(
                ['email' => 'menu-seeder@example.com'],
                [
                    'name' => 'Menu Seeder',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            $this->cleanupStaleData();

            $categories = collect($this->categories())
                ->mapWithKeys(function (array $category): array {
                    $record = MenuCategory::query()->updateOrCreate(
                        ['slug' => $category['slug']],
                        [
                            'name' => $category['name'],
                            'icon' => $category['icon'] ?? null,
                            'is_active' => $category['is_active'],
                            'sort_order' => $category['sort_order'],
                        ],
                    );

                    return [$record->slug => $record];
                });

            collect($this->menuItems())->each(function (array $item, int $index) use ($categories, $user): void {
                /** @var MenuItem $record */
                $record = MenuItem::query()->updateOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'menu_category_id' => $categories->get($item['category'])->id,
                        'name' => $item['name'],
                        'base_price' => $item['base_price'],
                        'promo_price' => null,
                        'description' => $item['description'],
                        'min_order' => 1,
                        'is_recommended' => false,
                        'sort_order' => $index + 1,
                        'is_active' => true,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                    ],
                );

                MenuImage::query()->updateOrCreate(
                    [
                        'menu_item_id' => $record->id,
                        'is_primary' => true,
                    ],
                    [
                        'image_url' => $item['image'],
                        'sort_order' => 1,
                    ],
                );
            });
        });

        cache()->forget('menu_categories');
    }

    private function cleanupStaleData(): void
    {
        $categorySlugs = collect($this->categories())->pluck('slug')->all();
        $itemSlugs = collect($this->menuItems())->pluck('slug')->all();

        MenuItem::query()
            ->whereNotIn('slug', $itemSlugs)
            ->delete();

        MenuCategory::query()
            ->whereNotIn('slug', $categorySlugs)
            ->delete();
    }

    /**
     * @return array<int, array{name: string, slug: string, icon?: string, is_active: bool, sort_order: int}>
     */
    private function categories(): array
    {
        return [
            ['name' => 'Snack', 'slug' => 'snack', 'icon' => 'sandwich', 'is_active' => true, 'sort_order' => 1],
            ['name' => 'Nasi', 'slug' => 'nasi', 'icon' => 'utensils', 'is_active' => true, 'sort_order' => 2],
            ['name' => 'Minuman/Es', 'slug' => 'minuman-es', 'icon' => 'cup-soda', 'is_active' => true, 'sort_order' => 3],
            ['name' => 'Soup', 'slug' => 'soup', 'icon' => 'soup', 'is_active' => true, 'sort_order' => 4],
        ];
    }

    /**
     * @return array<int, array{
     *     category: string,
     *     name: string,
     *     slug: string,
     *     base_price: int,
     *     description: string,
     *     image: string
     * }>
     */
    private function menuItems(): array
    {
        return [
            // Kategori: Snack
            [
                'category' => 'snack',
                'name' => 'Sosis Solo & Roti Gulung',
                'slug' => 'sosis-solo-roti-gulung',
                'base_price' => 2500,
                'description' => 'Sosis solo dengan roti gulung.',
                'image' => '',
            ],
            [
                'category' => 'snack',
                'name' => 'Sosis Solo & Roti Tiramisu',
                'slug' => 'sosis-solo-roti-tiramisu',
                'base_price' => 3000,
                'description' => 'Sosis solo dengan roti tiramisu.',
                'image' => '',
            ],
            [
                'category' => 'snack',
                'name' => 'Sosis Solo & Roti Proll',
                'slug' => 'sosis-solo-roti-proll',
                'base_price' => 2500,
                'description' => 'Sosis solo dengan roti proll.',
                'image' => '',
            ],

            // Kategori: Nasi
            [
                'category' => 'nasi',
                'name' => 'Nasi Pecel Gunung Sari',
                'slug' => 'nasi-pecel-gunung-sari',
                'base_price' => 20000,
                'description' => 'Nasi pecel khas Gunung Sari.',
                'image' => '',
            ],
            [
                'category' => 'nasi',
                'name' => 'Nasi Racikan',
                'slug' => 'nasi-racikan',
                'base_price' => 17500,
                'description' => 'Nasi racikan pilihan.',
                'image' => '',
            ],

            // Kategori: Minuman/Es
            [
                'category' => 'minuman-es',
                'name' => 'Es Puter',
                'slug' => 'es-puter',
                'base_price' => 5500,
                'description' => 'Es puter segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Es Buah',
                'slug' => 'es-buah',
                'base_price' => 4500,
                'description' => 'Es buah segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Es Kuwut',
                'slug' => 'es-kuwut',
                'base_price' => 4500,
                'description' => 'Es kuwut segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Es Kopyor',
                'slug' => 'es-kopyor',
                'base_price' => 4000,
                'description' => 'Es kopyor segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Es Dawet',
                'slug' => 'es-dawet',
                'base_price' => 4000,
                'description' => 'Es dawet segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Wedang Asle',
                'slug' => 'wedang-asle',
                'base_price' => 5000,
                'description' => 'Wedang asle segar.',
                'image' => '',
            ],
            [
                'category' => 'minuman-es',
                'name' => 'Teh Manis',
                'slug' => 'teh-manis',
                'base_price' => 2000,
                'description' => 'Teh manis segar.',
                'image' => '',
            ],

            // Kategori: Soup
            [
                'category' => 'soup',
                'name' => 'Galantin',
                'slug' => 'galantin',
                'base_price' => 5500,
                'description' => 'Galantin lezat.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Sup Matahari',
                'slug' => 'sup-matahari',
                'base_price' => 5500,
                'description' => 'Sup matahari istimewa.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Soup Manukan',
                'slug' => 'soup-manukan',
                'base_price' => 5500,
                'description' => 'Soup manukan segar.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Soup Ayam Rambutan',
                'slug' => 'soup-ayam-rambutan',
                'base_price' => 5500,
                'description' => 'Soup ayam rambutan.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Soup Bakso',
                'slug' => 'soup-bakso',
                'base_price' => 5500,
                'description' => 'Soup bakso hangat.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Selat Solo',
                'slug' => 'selat-solo',
                'base_price' => 8000,
                'description' => 'Selat solo khas.',
                'image' => '',
            ],
            [
                'category' => 'soup',
                'name' => 'Timlo',
                'slug' => 'timlo',
                'base_price' => 7000,
                'description' => 'Timlo gurih.',
                'image' => '',
            ],
        ];
    }
}