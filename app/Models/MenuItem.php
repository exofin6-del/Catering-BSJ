<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $menu_category_id
 * @property string $name
 * @property string $slug
 * @property string $base_price
 * @property string|null $promo_price
 * @property string|null $description
 * @property int $min_order
 * @property bool $is_recommended
 * @property int $sort_order
 * @property bool $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read MenuCategory|null $category
 * @property-read MenuImage|null $primaryImage
 * @property-read Collection<int, MenuImage> $images
 * @property-read Collection<int, PackageItem> $packageItems
 * @property-read Collection<int, PackageItemPrice> $packageItemPrices
 * @property-read Collection<int, OrderItem> $orderItems
 * @property-read User|null $creator
 * @property-read User|null $updater
 */
class MenuItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'menu_category_id',
        'name',
        'slug',
        'base_price',
        'promo_price',
        'description',
        'min_order',
        'is_recommended',
        'sort_order',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_recommended' => false,
        'min_order' => 1,
        'sort_order' => 0,
        'is_active' => true,
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'menu_category_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(MenuImage::class);
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(MenuImage::class)->where('is_primary', true);
    }

    public function packageItems(): HasMany
    {
        return $this->hasMany(PackageItem::class);
    }

    public function packageItemPrices(): HasMany
    {
        return $this->hasMany(PackageItemPrice::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @param  Builder<MenuItem>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * @param  Builder<MenuItem>  $query
     */
    public function scopeOrdered(Builder $query): void
    {
        $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'promo_price' => 'decimal:2',
            'min_order' => 'integer',
            'is_recommended' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }
}
