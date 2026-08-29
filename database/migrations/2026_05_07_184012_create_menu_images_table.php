<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_images', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('menu_item_id');
            $table->text('image_url');

            $table->string('cloudinary_public_id')
                ->nullable();

            $table->boolean('is_primary')
                ->default(false);

            $table->integer('sort_order')
                ->default(0);

            $table->timestamps();

            $table->index('menu_item_id');
            $table->index(['menu_item_id', 'is_primary']);

            $table->foreign('menu_item_id', 'menu_images_menu_item_id_foreign')
                ->references('id')
                ->on('menu_items')
                ->cascadeOnDelete();
        });

        $this->preventMultiplePrimaryImages();
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_images');
    }

    private function preventMultiplePrimaryImages(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::unprepared(<<<'SQL'
                CREATE TRIGGER menu_images_one_primary_insert
                BEFORE INSERT ON menu_images
                WHEN NEW.is_primary = 1
                    AND EXISTS (
                        SELECT 1
                        FROM menu_images
                        WHERE menu_item_id = NEW.menu_item_id
                            AND is_primary = 1
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Only one primary image is allowed per menu item.');
                END;
            SQL);

            DB::unprepared(<<<'SQL'
                CREATE TRIGGER menu_images_one_primary_update
                BEFORE UPDATE ON menu_images
                WHEN NEW.is_primary = 1
                    AND EXISTS (
                        SELECT 1
                        FROM menu_images
                        WHERE menu_item_id = NEW.menu_item_id
                            AND is_primary = 1
                            AND id <> NEW.id
                    )
                BEGIN
                    SELECT RAISE(ABORT, 'Only one primary image is allowed per menu item.');
                END;
            SQL);

            return;
        }

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER menu_images_one_primary_insert
            BEFORE INSERT ON menu_images
            FOR EACH ROW
            BEGIN
                IF NEW.is_primary = 1 AND EXISTS (
                    SELECT 1
                    FROM menu_images
                    WHERE menu_item_id = NEW.menu_item_id
                        AND is_primary = 1
                ) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one primary image is allowed per menu item.';
                END IF;
            END
        SQL);

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER menu_images_one_primary_update
            BEFORE UPDATE ON menu_images
            FOR EACH ROW
            BEGIN
                IF NEW.is_primary = 1 AND EXISTS (
                    SELECT 1
                    FROM menu_images
                    WHERE menu_item_id = NEW.menu_item_id
                        AND is_primary = 1
                        AND id <> NEW.id
                ) THEN
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one primary image is allowed per menu item.';
                END IF;
            END
        SQL);
    }
};
