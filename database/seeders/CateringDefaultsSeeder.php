<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CateringDefaultsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('business_settings')->updateOrInsert(
            ['id' => 1],
            [
                'business_name' => 'Catering BSJ',
                'business_lat' => null,
                'business_lng' => null,
                'max_order_km' => 10,
                'max_orders_per_day' => 3,
                'operational_start_time' => '07:00:00',
                'operational_end_time' => '17:00:00',
                'is_open' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        );
    }
}
