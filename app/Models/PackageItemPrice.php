<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PackageItemPrice extends Model
{
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'package_item_id',
        'menu_item_id',
        'package_price',
        'is_recommended',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_recommended' => false,
    ];

    public function packageItem(): BelongsTo
    {
        return $this->belongsTo(PackageItem::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'package_price' => 'decimal:2',
            'is_recommended' => 'boolean',
        ];
    }
}
