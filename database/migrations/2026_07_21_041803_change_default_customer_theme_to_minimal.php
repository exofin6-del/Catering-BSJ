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
        Schema::table('business_settings', function (Blueprint $table) {
            $table->string('customer_theme', 30)->default('minimal')->change();
        });

        DB::table('business_settings')
            ->where('customer_theme', 'sage')
            ->update(['customer_theme' => 'minimal']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_settings', function (Blueprint $table) {
            $table->string('customer_theme', 30)->default('sage')->change();
        });

        DB::table('business_settings')
            ->where('customer_theme', 'minimal')
            ->update(['customer_theme' => 'sage']);
    }
};
