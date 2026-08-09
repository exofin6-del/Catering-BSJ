<?php

namespace Tests\Feature\Settings;

use App\Models\BusinessSetting;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BusinessSettingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(PreventRequestForgery::class);
    }

    public function test_guests_cannot_open_business_settings(): void
    {
        $this->get(route('business.edit'))
            ->assertRedirect(route('login'));
    }

    public function test_business_settings_page_is_displayed(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('business.edit'))
            ->assertOk()
            ->assertInertia(
                fn (Assert $page) => $page
                    ->component('settings/business')
                    ->where('businessSetting.business_name', 'Catering BSJ')
                    ->where('businessSetting.whatsapp_number', null)
                    ->where('businessSetting.max_orders_per_day', 3)
                    ->where('businessSetting.customer_theme', 'minimal')
            );
    }

    public function test_business_settings_can_be_updated_without_creating_duplicates(): void
    {
        $this->actingAs(User::factory()->create());

        $payload = [
            'business_name' => 'Dapur Nusantara',
            'whatsapp_number' => '0812 3456 7890',
            'business_lat' => -7.5667000,
            'business_lng' => 110.8167000,
            'business_address' => 'Jl. Slamet Riyadi No. 12, Surakarta',
            'max_order_km' => 25,
            'max_orders_per_day' => 12,
            'operational_start_time' => '07:00',
            'operational_end_time' => '18:00',
            'is_open' => true,
            'customer_theme' => 'ocean',
        ];

        $this->patch(route('business.update'), $payload)
            ->assertRedirect(route('business.edit'));
        $this->patch(route('business.update'), [
            ...$payload,
            'max_orders_per_day' => 15,
        ])->assertRedirect(route('business.edit'));

        $this->assertDatabaseCount('business_settings', 1);
        $setting = BusinessSetting::query()->sole();

        $this->assertSame('Dapur Nusantara', $setting->business_name);
        $this->assertSame('0812 3456 7890', $setting->whatsapp_number);
        $this->assertSame(15, $setting->max_orders_per_day);
        $this->assertSame('25.00', $setting->max_order_km);
        $this->assertSame('ocean', $setting->customer_theme);
        $this->assertSame('Jl. Slamet Riyadi No. 12, Surakarta', $setting->business_address);
    }

    public function test_business_settings_can_clear_the_location(): void
    {
        $this->actingAs(User::factory()->create());

        $payload = [
            'business_name' => 'Dapur Nusantara',
            'whatsapp_number' => '0812 3456 7890',
            'business_lat' => -7.5667000,
            'business_lng' => 110.8167000,
            'business_address' => 'Jl. Slamet Riyadi No. 12, Surakarta',
            'max_order_km' => 25,
            'max_orders_per_day' => 12,
            'operational_start_time' => '07:00',
            'operational_end_time' => '18:00',
            'is_open' => true,
            'customer_theme' => 'ocean',
        ];

        $this->patch(route('business.update'), $payload)
            ->assertRedirect(route('business.edit'));

        $this->patch(route('business.update'), [
            'business_name' => 'Dapur Nusantara',
            'whatsapp_number' => '0812 3456 7890',
            'business_lat' => '',
            'business_lng' => '',
            'business_address' => '',
            'max_order_km' => 25,
            'max_orders_per_day' => 12,
            'operational_start_time' => '07:00',
            'operational_end_time' => '18:00',
            'is_open' => true,
            'customer_theme' => 'ocean',
        ])->assertRedirect(route('business.edit'));

        $setting = BusinessSetting::query()->sole();

        $this->assertNull($setting->business_lat);
        $this->assertNull($setting->business_lng);
        $this->assertNull($setting->business_address);
    }

    public function test_business_settings_accept_the_new_customer_theme_presets(): void
    {
        $this->actingAs(User::factory()->create());

        $payload = [
            'business_name' => 'Dapur Nusantara',
            'whatsapp_number' => '081234567890',
            'business_lat' => -7.5667000,
            'business_lng' => 110.8167000,
            'max_order_km' => 25,
            'max_orders_per_day' => 12,
            'operational_start_time' => '07:00',
            'operational_end_time' => '18:00',
            'is_open' => true,
            'customer_theme' => 'rose',
        ];

        $this->patch(route('business.update'), $payload)
            ->assertRedirect(route('business.edit'));

        $this->patch(route('business.update'), [
            ...$payload,
            'customer_theme' => 'citrus',
        ])->assertRedirect(route('business.edit'));

        $this->assertDatabaseHas('business_settings', [
            'customer_theme' => 'citrus',
        ]);
    }

    public function test_business_settings_require_valid_capacity_location_and_hours(): void
    {
        $this->actingAs(User::factory()->create());

        $this->from(route('business.edit'))
            ->patch(route('business.update'), [
                'business_name' => 'Valid Name',
                'whatsapp_number' => 'nomor-tidak-valid',
                'business_lat' => 91,
                'business_lng' => 181,
                'max_order_km' => 0,
                'max_orders_per_day' => 0,
                'operational_start_time' => '18:00',
                'operational_end_time' => '07:00',
                'is_open' => true,
                'customer_theme' => 'neon',
            ])
            ->assertRedirect(route('business.edit'))
            ->assertSessionHasErrors([
                'whatsapp_number',
                'business_lat',
                'business_lng',
                'max_order_km',
                'max_orders_per_day',
                'operational_end_time',
                'customer_theme',
            ]);
    }

    public function test_business_settings_can_upload_customer_home_images(): void
    {
        $this->actingAs(User::factory()->create());
        Storage::fake('public');

        $this->patch(route('business.update'), [
            'business_name' => 'Catering Modern',
            'whatsapp_number' => '081234567890',
            'business_lat' => -7.5667000,
            'business_lng' => 110.8167000,
            'max_order_km' => 25,
            'max_orders_per_day' => 12,
            'operational_start_time' => '07:00',
            'operational_end_time' => '18:00',
            'is_open' => true,
            'customer_theme' => 'minimal',
            'hero_image_0' => UploadedFile::fake()->image('hero-1.jpg'),
            'hero_image_1' => UploadedFile::fake()->image('hero-2.webp'),
        ])->assertRedirect(route('business.edit'));

        $setting = BusinessSetting::query()->sole();

        $this->assertIsArray($setting->hero_images);
        $this->assertCount(2, $setting->hero_images);
        $this->assertStringContainsString('business/hero', $setting->hero_images[0]);
        $this->assertStringContainsString('business/hero', $setting->hero_images[1]);

        $firstImagePath = ltrim((string) parse_url($setting->hero_images[0], PHP_URL_PATH), '/');
        $firstImagePath = str_replace('storage/', '', $firstImagePath);
        Storage::disk('public')->assertExists($firstImagePath);
    }

    public function test_business_settings_can_save_customer_home_images_via_multipart_method_spoofed_request(): void
    {
        $this->actingAs(User::factory()->create());
        Storage::fake('public');

        $this->post(route('business.update'), [
            'business_name' => 'Catering Modern',
            'description' => 'Catering harian',
            'whatsapp_number' => '081234567890',
            'is_open' => '1',
            '_method' => 'PATCH',
            'hero_image_0' => UploadedFile::fake()->image('hero-1.jpg'),
            'hero_image_2' => UploadedFile::fake()->image('hero-3.png'),
        ])->assertRedirect(route('business.edit'));

        $setting = BusinessSetting::query()->sole();

        $this->assertIsArray($setting->hero_images);
        $this->assertCount(2, $setting->hero_images);
        $this->assertNotNull($setting->hero_images[0]);
        $this->assertNotNull($setting->hero_images[1]);
    }

    public function test_business_logo_can_be_replaced_through_a_multipart_method_spoofed_request(): void
    {
        $this->actingAs(User::factory()->create());
        Storage::fake('public');

        $payload = [
            'business_name' => 'Catering Modern',
            'description' => 'Catering harian',
            'whatsapp_number' => '081234567890',
            'is_open' => '1',
            '_method' => 'PATCH',
        ];

        $this->post(route('business.update'), [
            ...$payload,
            'logo' => UploadedFile::fake()->image('logo-lama.jpg'),
        ])->assertRedirect(route('business.edit'));

        $setting = BusinessSetting::query()->sole();
        $oldPath = ltrim((string) parse_url($setting->logo, PHP_URL_PATH), '/storage/');

        $this->post(route('business.update'), [
            ...$payload,
            'logo' => UploadedFile::fake()->image('logo-baru.png'),
        ])->assertRedirect(route('business.edit'));

        $setting->refresh();
        $newPath = ltrim((string) parse_url($setting->logo, PHP_URL_PATH), '/storage/');

        $this->assertNotSame($oldPath, $newPath);
        Storage::disk('public')->assertMissing($oldPath);
        Storage::disk('public')->assertExists($newPath);
    }
}
