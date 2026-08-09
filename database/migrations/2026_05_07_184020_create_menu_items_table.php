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
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('menu_category_id')
                ->nullable();

            $table->string('name');
            $table->string('slug')
                ->unique();

            $table->decimal('base_price', 12, 2);
            $table->decimal('promo_price', 12, 2)
                ->nullable();

            $table->text('description')
                ->nullable();

            $table->unsignedInteger('min_order')->default(1);

            $table->boolean('is_recommended')
                ->default(false)
                ->index();

            $table->integer('sort_order')
                ->default(0)
                ->index();

            $table->boolean('is_active')
                ->default(true)
                ->index();
            $table->unsignedBigInteger('created_by')
                ->nullable();
            $table->unsignedBigInteger('updated_by')
                ->nullable();

            $table->timestamps();

            $table->index(['menu_category_id', 'is_active']);
            $table->index('created_by', 'menu_items_created_by_foreign');
            $table->index('updated_by', 'menu_items_updated_by_foreign');

            $table->foreign('menu_category_id', 'menu_items_menu_category_id_foreign')
                ->references('id')
                ->on('menu_categories')
                ->nullOnDelete();

            $table->foreign('created_by', 'menu_items_created_by_foreign')
                ->references('id')->on('users')
                ->nullOnDelete();

            $table->foreign('updated_by', 'menu_items_updated_by_foreign')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });

        $this->addCheckConstraint(
            'menu_items_values_check',
            'base_price >= 0 AND (promo_price IS NULL OR (promo_price >= 0 AND promo_price <= base_price)) AND min_order > 0 AND sort_order >= 0',
            'NEW.base_price >= 0 AND (NEW.promo_price IS NULL OR (NEW.promo_price >= 0 AND NEW.promo_price <= NEW.base_price)) AND NEW.min_order > 0 AND NEW.sort_order >= 0',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON menu_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON menu_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        DB::statement("ALTER TABLE menu_items ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
