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
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('menu_item_id')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();
            $table->enum('item_type', ['menu_item', 'package'])->default('menu_item')->index();
            $table->string('name_snapshot')->nullable();
            $table->decimal('price_snapshot', 12, 2)->nullable();
            $table->integer('qty')->default(1);
            $table->decimal('subtotal', 12, 2)->nullable();
            $table->json('selected_items')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->index('menu_item_id');
            $table->index('package_id');
            $table->foreign('order_id', 'order_items_order_id_foreign')->references('id')->on('orders')->cascadeOnDelete();
            $table->foreign('menu_item_id', 'order_items_menu_item_id_foreign')->references('id')->on('menu_items')->nullOnDelete();
            $table->foreign('package_id', 'order_items_package_id_foreign')->references('id')->on('packages')->nullOnDelete();
        });

        $this->addCheckConstraint(
            'order_items_reference_check',
            'NOT (menu_item_id IS NOT NULL AND package_id IS NOT NULL) AND (menu_item_id IS NULL OR item_type = \'menu_item\') AND (package_id IS NULL OR item_type = \'package\')',
            "NOT (NEW.menu_item_id IS NOT NULL AND NEW.package_id IS NOT NULL) AND (NEW.menu_item_id IS NULL OR NEW.item_type = 'menu_item') AND (NEW.package_id IS NULL OR NEW.item_type = 'package')",
        );

        $this->addCheckConstraint(
            'order_items_values_check',
            'qty > 0 AND (price_snapshot IS NULL OR price_snapshot >= 0) AND (subtotal IS NULL OR subtotal >= 0)',
            'NEW.qty > 0 AND (NEW.price_snapshot IS NULL OR NEW.price_snapshot >= 0) AND (NEW.subtotal IS NULL OR NEW.subtotal >= 0)',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON order_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON order_items WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        if ($driver === 'mysql') {
            // Use trigger for MySQL instead of CHECK constraint due to foreign key limitations
            $triggerName = "{$name}_insert";
            $condition = str_replace(['menu_item_id', 'package_id', 'item_type', 'qty', 'price_snapshot', 'subtotal'], ['NEW.menu_item_id', 'NEW.package_id', 'NEW.item_type', 'NEW.qty', 'NEW.price_snapshot', 'NEW.subtotal'], $condition);

            DB::unprepared("DROP TRIGGER IF EXISTS {$triggerName}");
            DB::unprepared("
                CREATE TRIGGER {$triggerName} BEFORE INSERT ON order_items
                FOR EACH ROW
                BEGIN
                    IF NOT ({$condition}) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$name}';
                    END IF;
                END;
            ");

            $triggerName = "{$name}_update";
            DB::unprepared("DROP TRIGGER IF EXISTS {$triggerName}");
            DB::unprepared("
                CREATE TRIGGER {$triggerName} BEFORE UPDATE ON order_items
                FOR EACH ROW
                BEGIN
                    IF NOT ({$condition}) THEN
                        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '{$name}';
                    END IF;
                END;
            ");

            return;
        }

        // For other databases, use CHECK constraint
        DB::statement("ALTER TABLE order_items ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
