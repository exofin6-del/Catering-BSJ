<?php

namespace App\Models;

use App\CustomerTheme;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'business_name',
        'description',
        'whatsapp_number',
        'business_lat',
        'business_lng',
        'business_address',
        'max_order_km',
        'max_orders_per_day',
        'operational_start_time',
        'operational_end_time',
        'is_open',
        'customer_theme',
        'hero_images',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'business_name' => 'Catering BSJ',
        'max_order_km' => 10,
        'max_orders_per_day' => 3,
        'operational_start_time' => '08:00:00',
        'operational_end_time' => '17:00:00',
        'is_open' => true,
        'customer_theme' => CustomerTheme::Minimal->value,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'business_lat' => 'decimal:7',
            'business_lng' => 'decimal:7',
            'max_order_km' => 'decimal:2',
            'max_orders_per_day' => 'integer',
            'is_open' => 'boolean',
            'hero_images' => 'array',
        ];
    }

    public function normalizedWhatsAppNumber(): ?string
    {
        if (blank($this->whatsapp_number)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', (string) $this->whatsapp_number) ?? '';

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        }

        if (! str_starts_with($digits, '62') || strlen($digits) < 10 || strlen($digits) > 15) {
            return null;
        }

        return $digits;
    }
}
