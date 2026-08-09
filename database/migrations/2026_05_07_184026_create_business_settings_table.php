<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name')->default('Catering BSJ');
            $table->decimal('business_lat', 10, 7)->nullable();
            $table->decimal('business_lng', 10, 7)->nullable();
            $table->decimal('max_order_km', 8, 2)->default(10);
            $table->unsignedInteger('max_orders_per_day')->default(3);
            $table->time('operational_start_time')->default('08:00:00');
            $table->time('operational_end_time')->default('17:00:00');
            $table->boolean('is_open')->default(true);
            $table->timestamps();
        });

        $this->addCheckConstraint(
            'business_settings_values_check',
            'max_order_km >= 0',
            'NEW.max_order_km >= 0',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON business_settings WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON business_settings WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        DB::statement("ALTER TABLE business_settings ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
