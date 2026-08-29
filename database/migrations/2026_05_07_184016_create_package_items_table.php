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
        Schema::create('package_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id');
            $table->string('name')->nullable();
            $table->unsignedBigInteger('menu_item_id')->nullable();
            $table->unsignedBigInteger('menu_category_id')->nullable();
            $table->boolean('is_recommended')->default(false);
            $table->decimal('package_price', 12, 2)->nullable();
            $table->integer('min_select')->nullable();
            $table->integer('max_select')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('package_id');
            $table->index('menu_item_id');
            $table->index('menu_category_id');
            $table->index(['package_id', 'sort_order']);
            $table->foreign('package_id', 'package_items_package_id_foreign')->references('id')->on('packages')->cascadeOnDelete();
            $table->foreign('menu_item_id', 'package_items_menu_item_id_foreign')->references('id')->on('menu_items')->nullOnDelete();
            $table->foreign('menu_category_id', 'package_items_menu_category_id_foreign')->references('id')->on('menu_categories')->nullOnDelete();
        });

        $this->addCheckConstraint(
            'package_items_selection_check',
            'NOT (menu_item_id IS NOT NULL AND menu_category_id IS NOT NULL)',
            'NOT (NEW.menu_item_id IS NOT NULL AND NEW.menu_category_id IS NOT NULL)',
        );

        $this->addCheckConstraint(
            'package_items_values_check',
            '(package_price IS NULL OR package_price >= 0) AND (min_select IS NULL OR min_select >= 0) AND (max_select IS NULL OR max_select >= 0) AND (min_select IS NULL OR max_select IS NULL OR max_select >= min_select) AND sort_order >= 0',
            '(NEW.package_price IS NULL OR NEW.package_price >= 0) AND (NEW.min_select IS NULL OR NEW.min_select >= 0) AND (NEW.max_select IS NULL OR NEW.max_select >= 0) AND (NEW.min_select IS NULL OR NEW.max_select IS NULL OR NEW.max_select >= NEW.min_select) AND NEW.sort_order >= 0',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_items');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON package_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON package_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        if ($driver === 'mysql') {
            $triggerName = "{$name}_insert";
            $mysqlCondition = $this->mysqlTriggerCondition($condition);

            DB::unprepared("DROP TRIGGER IF EXISTS {$triggerName}");
            DB::unprepared("
                CREATE TRIGGER {$triggerName} BEFORE INSERT ON package_items
                FOR EACH ROW
                BEGIN
                    IF NOT ({$mysqlCondition}) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$name}';
                    END IF;
                END;
            ");

            $triggerName = "{$name}_update";
            DB::unprepared("DROP TRIGGER IF EXISTS {$triggerName}");
            DB::unprepared("
                CREATE TRIGGER {$triggerName} BEFORE UPDATE ON package_items
                FOR EACH ROW
                BEGIN
                    IF NOT ({$mysqlCondition}) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$name}';
                    END IF;
                END;
            ");

            return;
        }

        // For other databases, use CHECK constraint
        DB::statement("ALTER TABLE package_items ADD CONSTRAINT {$name} CHECK ({$condition})");
    }

    private function mysqlTriggerCondition(string $condition): string
    {
        $columns = [
            'package_price',
            'menu_item_id',
            'menu_category_id',
            'min_select',
            'max_select',
            'sort_order',
        ];

        return (string) preg_replace(
            array_map(fn ($col) => '/\b'.$col.'\b/', $columns),
            array_map(fn ($col) => 'NEW.'.$col, $columns),
            $condition,
        );
    }
};
