<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Package extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'package_category_id',
        'name',
        'slug',
        'price',
        'min_order',
        'description',
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
        'min_order' => 1,
        'is_recommended' => false,
        'sort_order' => 0,
        'is_active' => true,
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(PackageCategory::class, 'package_category_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(PackageImage::class);
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(PackageImage::class)->where('is_primary', true);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PackageItem::class);
    }

    public function packageItems(): HasMany
    {
        return $this->items();
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
     * @param  Builder<Package>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('is_active', true);
    }

    /**
     * @param  Builder<Package>  $query
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
            'price' => 'decimal:2',
            'package_category_id' => 'integer',
            'min_order' => 'integer',
            'is_recommended' => 'boolean',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }
}
