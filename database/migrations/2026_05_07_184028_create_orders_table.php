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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 50)->unique();
            $table->string('customer_name');
            $table->string('phone', 20);
            $table->date('event_date');
            $table->time('event_time')->nullable();
            $table->string('event_name')->default('');
            $table->text('address_name')->nullable();
            $table->text('event_address');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('order_distance_km', 8, 2)->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->enum('payment_type', ['dp', 'full'])->default('full');
            $table->decimal('dp_amount', 12, 2)->default(0);
            $table->decimal('remaining_amount', 12, 2)->default(0);
            $table->enum('payment_status', ['unpaid', 'dp_paid', 'paid'])->default('unpaid')->index();
            $table->enum('status', ['pending_confirmation', 'confirmed', 'completed', 'canceled'])->default('pending_confirmation')->index();
            $table->unsignedBigInteger('created_by_admin_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['latitude', 'longitude']);
            $table->index('created_by_admin_id', 'orders_created_by_admin_id_foreign');
            $table->foreign('created_by_admin_id', 'orders_created_by_admin_id_foreign')->references('id')->on('users')->nullOnDelete();
        });

        $this->addCheckConstraint(
            'orders_location_check',
            'latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180',
            'NEW.latitude >= -90 AND NEW.latitude <= 90 AND NEW.longitude >= -180 AND NEW.longitude <= 180',
        );

        $this->addCheckConstraint(
            'orders_values_check',
            '(order_distance_km IS NULL OR order_distance_km >= 0) AND subtotal >= 0 AND total_price >= 0 AND dp_amount >= 0 AND dp_amount <= total_price AND remaining_amount >= 0 AND remaining_amount <= total_price',
            '(NEW.order_distance_km IS NULL OR NEW.order_distance_km >= 0) AND NEW.subtotal >= 0 AND NEW.total_price >= 0 AND NEW.dp_amount >= 0 AND NEW.dp_amount <= NEW.total_price AND NEW.remaining_amount >= 0 AND NEW.remaining_amount <= NEW.total_price',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON orders WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON orders WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        DB::statement("ALTER TABLE orders ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
