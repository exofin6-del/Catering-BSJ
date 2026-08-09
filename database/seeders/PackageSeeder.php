<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Package;
use App\Models\PackageCategory;
use App\Models\PackageImage;
use App\Models\PackageItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PackageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function (): void {
            $user = User::query()->firstOrCreate(
                ['email' => 'package-seeder@example.com'],
                [
                    'name' => 'Package Seeder',
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            $this->cleanupStaleData();

            $categories = collect($this->categories())
                ->mapWithKeys(function (array $category): array {
                    $record = PackageCategory::query()->updateOrCreate(
                        ['slug' => $category['slug']],
                        [
                            'name' => $category['name'],
                            'icon' => $category['icon'] ?? null,
                            'is_active' => true,
                            'sort_order' => $category['sort_order'],
                        ],
                    );

                    return [$record->slug => $record];
                });

            $menuItems = MenuItem::query()
                ->whereIn('slug', $this->menuSlugs())
                ->get()
                ->keyBy('slug');

            collect($this->packages())->each(function (array $package, int $index) use ($categories, $menuItems, $user): void {
                /** @var Package $record */
                $record = Package::query()->updateOrCreate(
                    ['slug' => $package['slug']],
                    [
                        'package_category_id' => $categories->get($package['category'])->id,
                        'name' => $package['name'],
                        'price' => $package['price'],
                        'min_order' => $package['min_order'],
                        'description' => $package['description'],
                        'is_recommended' => $package['is_recommended'],
                        'sort_order' => $index + 1,
                        'is_active' => true,
                        'created_by' => $user->id,
                        'updated_by' => $user->id,
                    ],
                );

                PackageImage::query()->updateOrCreate(
                    [
                        'package_id' => $record->id,
                        'is_primary' => true,
                    ],
                    [
                        'image_url' => $package['image'],
                        'sort_order' => 1,
                    ],
                );

                $this->syncPackageItems($record, $package, $menuItems);
            });
        });
    }

    private function cleanupStaleData(): void
    {
        $categorySlugs = collect($this->categories())->pluck('slug')->all();
        $packageSlugs = collect($this->packages())->pluck('slug')->all();

        Package::query()
            ->whereNotIn('slug', $packageSlugs)
            ->delete();

        PackageCategory::query()
            ->whereNotIn('slug', $categorySlugs)
            ->delete();
    }

    /**
     * @param  array<string, mixed>  $packageData
     * @param  Collection<string, MenuItem>  $menuItems
     */
    private function syncPackageItems(Package $package, array $packageData, Collection $menuItems): void
    {
        $itemSlugs = collect($packageData['items'])->values();

        $package->items()
            ->where('sort_order', '>', $itemSlugs->count())
            ->delete();

        $itemSlugs->each(function (string $slug, int $index) use ($package, $packageData, $menuItems): void {
            /** @var MenuItem $menuItem */
            $menuItem = $menuItems->get($slug);

            PackageItem::query()->updateOrCreate(
                [
                    'package_id' => $package->id,
                    'sort_order' => $index + 1,
                ],
                [
                    'name' => $menuItem->name,
                    'menu_item_id' => $menuItem->id,
                    'menu_category_id' => null,
                    'is_recommended' => $index === 0,
                    'package_price' => $this->customPackageItemPrice(
                        $menuItem,
                        $packageData['price'],
                        count($packageData['items']),
                        $index,
                    ),
                    'min_select' => null,
                    'max_select' => null,
                ],
            );
        });
    }

    private function customPackageItemPrice(MenuItem $menuItem, int $packagePrice, int $itemCount, int $index): int
    {
        return min(
            $this->packageItemPrice($packagePrice, $itemCount, $index),
            (int) $menuItem->base_price,
        );
    }

    private function packageItemPrice(int $packagePrice, int $itemCount, int $index): int
    {
        $basePrice = intdiv($packagePrice, $itemCount);
        $remainder = $packagePrice % $itemCount;

        return $basePrice + ($index < $remainder ? 1 : 0);
    }

    /**
     * @return array<int, array{name: string, slug: string, sort_order: int}>
     */
    private function categories(): array
    {
        return [
            ['name' => 'Paket Nasi', 'slug' => 'paket-nasi', 'icon' => 'utensils', 'sort_order' => 1],
            ['name' => 'Paket Snack', 'slug' => 'paket-snack', 'icon' => 'sandwich', 'sort_order' => 2],
            ['name' => 'Paket Lengkap', 'slug' => 'paket-lengkap', 'icon' => 'chef-hat', 'sort_order' => 3],
            ['name' => 'Paket Soup', 'slug' => 'paket-soup', 'icon' => 'soup', 'sort_order' => 4],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function menuSlugs(): array
    {
        return collect($this->packages())
            ->pluck('items')
            ->flatten()
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{
     *     category: string,
     *     name: string,
     *     slug: string,
     *     price: int,
     *     min_order: int,
     *     description: string,
     *     is_recommended: bool,
     *     image: string,
     *     items: array<int, string>
     * }>
     */
    private function packages(): array
    {
        return [
            // Kategori: Paket Nasi
            [
                'category' => 'paket-nasi',
                'name' => 'Paket Nasi Pecel Gunung Sari + Es Teh Manis',
                'slug' => 'paket-nasi-pecel-es-teh',
                'price' => 22000,
                'min_order' => 10,
                'description' => 'Nasi pecel Gunung Sari lengkap dengan es teh manis.',
                'is_recommended' => true,
                'image' => '',
                'items' => ['nasi-pecel-gunung-sari', 'teh-manis'],
            ],
            [
                'category' => 'paket-nasi',
                'name' => 'Paket Nasi Racikan + Es Teh Manis',
                'slug' => 'paket-nasi-racikan-es-teh',
                'price' => 19500,
                'min_order' => 10,
                'description' => 'Nasi racikan pilihan dengan es teh manis.',
                'is_recommended' => false,
                'image' => '',
                'items' => ['nasi-racikan', 'teh-manis'],
            ],

            // Kategori: Paket Snack
            [
                'category' => 'paket-snack',
                'name' => 'Paket Snack Sosis Solo + Es Teh Manis',
                'slug' => 'paket-snack-sosis-es-teh',
                'price' => 4500,
                'min_order' => 20,
                'description' => 'Sosis solo & roti gulung dengan es teh manis.',
                'is_recommended' => true,
                'image' => '',
                'items' => ['sosis-solo-roti-gulung', 'teh-manis'],
            ],

            // Kategori: Paket Soup
            [
                'category' => 'paket-soup',
                'name' => 'Paket Soup Galantin + Nasi',
                'slug' => 'paket-soup-galantin-nasi',
                'price' => 25500,
                'min_order' => 10,
                'description' => 'Galantin hangat dengan nasi racikan.',
                'is_recommended' => true,
                'image' => '',
                'items' => ['galantin', 'nasi-racikan'],
            ],
            [
                'category' => 'paket-soup',
                'name' => 'Paket Selat Solo + Nasi',
                'slug' => 'paket-selat-solo-nasi',
                'price' => 28000,
                'min_order' => 10,
                'description' => 'Selat solo khas dengan nasi racikan.',
                'is_recommended' => false,
                'image' => '',
                'items' => ['selat-solo', 'nasi-racikan'],
            ],

            // Kategori: Paket Lengkap
            [
                'category' => 'paket-lengkap',
                'name' => 'Paket Lengkap Nasi Pecel + Snack + Es Teh',
                'slug' => 'paket-lengkap-pecel',
                'price' => 26500,
                'min_order' => 10,
                'description' => 'Nasi pecel Gunung Sari, sosis solo & roti gulung, dan es teh manis.',
                'is_recommended' => true,
                'image' => '',
                'items' => ['nasi-pecel-gunung-sari', 'sosis-solo-roti-gulung', 'teh-manis'],
            ],
            [
                'category' => 'paket-lengkap',
                'name' => 'Paket Lengkap Nasi Racikan + Snack + Es Teh',
                'slug' => 'paket-lengkap-racikan',
                'price' => 24000,
                'min_order' => 10,
                'description' => 'Nasi racikan, sosis solo & roti gulung, dan es teh manis.',
                'is_recommended' => false,
                'image' => '',
                'items' => ['nasi-racikan', 'sosis-solo-roti-gulung', 'teh-manis'],
            ],
        ];
    }
}