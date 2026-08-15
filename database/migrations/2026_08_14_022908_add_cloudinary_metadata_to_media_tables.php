<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('menu_images', function (Blueprint $table) {
            $table->string('cloudinary_public_id')->nullable()->after('image_url');
        });

        Schema::table('package_images', function (Blueprint $table) {
            $table->string('cloudinary_public_id')->nullable()->after('image_url');
        });

        Schema::table('business_settings', function (Blueprint $table) {
            $table->string('logo_cloudinary_public_id')->nullable()->after('logo');
            $table->json('hero_image_cloudinary_public_ids')->nullable()->after('hero_images');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('cloudinary_public_id')->nullable()->after('proof_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_images', function (Blueprint $table) {
            $table->dropColumn('cloudinary_public_id');
        });

        Schema::table('package_images', function (Blueprint $table) {
            $table->dropColumn('cloudinary_public_id');
        });

        Schema::table('business_settings', function (Blueprint $table) {
            $table->dropColumn(['logo_cloudinary_public_id', 'hero_image_cloudinary_public_ids']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('cloudinary_public_id');
        });
    }
};
