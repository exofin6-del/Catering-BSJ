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
        Schema::create('package_images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id');
            $table->text('image_url');
            $table->boolean('is_primary')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->index('package_id');
            $table->index(['package_id', 'is_primary']);
            $table->foreign('package_id', 'package_images_package_id_foreign')->references('id')->on('packages')->cascadeOnDelete();
        });

        $this->preventMultiplePrimaryImages();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package_images');
    }

    private function preventMultiplePrimaryImages(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER package_images_one_primary_insert
                BEFORE INSERT ON package_images
                WHEN NEW.is_primary = 1
                    AND EXISTS (
                        SELECT 1
                        FROM package_images
                        WHERE package_id = NEW.package_id
                            AND is_primary = 1
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Only one primary image is allowed per package.');
                END;
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER package_images_one_primary_update
                BEFORE UPDATE ON package_images
                WHEN NEW.is_primary = 1
                    AND EXISTS (
                        SELECT 1
                        FROM package_images
                        WHERE package_id = NEW.package_id
                            AND is_primary = 1
                            AND id <> NEW.id
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Only one primary image is allowed per package.');
                END;
            SQL);

            return;
        }

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER package_images_one_primary_insert
            BEFORE INSERT ON package_images
            FOR EACH ROW
            BEGIN
                IF NEW.is_primary = 1 AND EXISTS (
                    SELECT 1
                    FROM package_images
                    WHERE package_id = NEW.package_id
                        AND is_primary = 1
                ) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one primary image is allowed per package.';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER package_images_one_primary_update
            BEFORE UPDATE ON package_images
            FOR EACH ROW
            BEGIN
                IF NEW.is_primary = 1 AND EXISTS (
                    SELECT 1
                    FROM package_images
                    WHERE package_id = NEW.package_id
                        AND is_primary = 1
                        AND id <> NEW.id
                ) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one primary image is allowed per package.';
                END IF;
            END
        SQL);
    }
};
