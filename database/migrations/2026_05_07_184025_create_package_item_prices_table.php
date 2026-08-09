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
        Schema::create('package_item_prices', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_item_id');
            $table->unsignedBigInteger('menu_item_id');
            $table->decimal('package_price', 12, 2)->nullable();
            $table->boolean('is_recommended')->default(false);

            $table->unique(['package_item_id', 'menu_item_id']);
            $table->index('menu_item_id');
            $table->foreign('package_item_id', 'package_item_prices_package_item_id_foreign')->references('id')->on('package_items')->cascadeOnDelete();
            $table->foreign('menu_item_id', 'package_item_prices_menu_item_id_foreign')->references('id')->on('menu_items')->cascadeOnDelete();
        });

        $this->addCheckConstraint(
            'package_item_prices_values_check',
            'package_price IS NULL OR package_price >= 0',
            'NEW.package_price IS NULL OR NEW.package_price >= 0',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_item_prices');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON package_item_prices WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON package_item_prices WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        DB::statement("ALTER TABLE package_item_prices ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
