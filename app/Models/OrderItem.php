<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_id',
        'menu_item_id',
        'package_id',
        'item_type',
        'name_snapshot',
        'price_snapshot',
        'qty',
        'subtotal',
        'selected_items',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'item_type' => 'menu_item',
        'qty' => 1,
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price_snapshot' => 'decimal:2',
            'qty' => 'integer',
            'subtotal' => 'decimal:2',
            'selected_items' => 'array',
        ];
    }
}
