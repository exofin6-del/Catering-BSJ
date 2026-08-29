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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->enum('type', ['dp', 'full', 'remaining'])->index();
            $table->decimal('amount', 12, 2);
            $table->enum('method', ['transfer', 'cash', 'manual'])->nullable()->index();
            $table->timestamp('paid_at')->nullable()->index();
            $table->text('proof_image')->nullable();
            $table->string('cloudinary_public_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('order_id');
            $table->foreign('order_id', 'payments_order_id_foreign')->references('id')->on('orders')->cascadeOnDelete();
        });

        $this->addCheckConstraint(
            'payments_values_check',
            'amount >= 0',
            'NEW.amount >= 0',
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }

    private function addCheckConstraint(string $name, string $condition, string $sqliteCondition): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared("CREATE TRIGGER {$name}_insert BEFORE INSERT ON payments WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");
            DB::unprepared("CREATE TRIGGER {$name}_update BEFORE UPDATE ON payments WHEN NOT ({$sqliteCondition}) BEGIN SELECT RAISE(ABORT, '{$name}'); END;");

            return;
        }

        DB::statement("ALTER TABLE payments ADD CONSTRAINT {$name} CHECK ({$condition})");
    }
};
