<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PackageItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'package_id',
        'name',
        'menu_item_id',
        'menu_category_id',
        'is_recommended',
        'package_price',
        'min_select',
        'max_select',
        'sort_order',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_recommended' => false,
        'sort_order' => 0,
    ];

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function menuCategory(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(PackageItemPrice::class);
    }

    public function itemPrices(): HasMany
    {
        return $this->prices();
    }

    public function selectableMenuItems(): BelongsToMany
    {
        return $this->belongsToMany(MenuItem::class, 'package_item_prices')
            ->withPivot(['package_price', 'is_recommended']);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_recommended' => 'boolean',
            'package_price' => 'decimal:2',
            'min_select' => 'integer',
            'max_select' => 'integer',
            'sort_order' => 'integer',
        ];
    }
}
