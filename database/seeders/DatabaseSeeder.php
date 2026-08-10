<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CateringDefaultsSeeder::class,
            MenuSeeder::class,
            PackageSeeder::class,
        ]);

        // User::factory(10)->create();
        // User::query()->firstOrCreate(
        //     ['email' => 'admin@example.com'],
        //     [
        //         'name' => 'Example Admin',
        //         'password' => Hash::make('12345678'),
        //         'email_verified_at' => now(),
        //     ],
        // );
    }
}
