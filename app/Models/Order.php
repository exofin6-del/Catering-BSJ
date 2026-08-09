<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'order_code',
        'customer_name',
        'phone',
        'event_date',
        'event_time',
        'event_name',
        'address_name',
        'event_address',
        'latitude',
        'longitude',
        'order_distance_km',
        'subtotal',
        'total_price',
        'payment_type',
        'dp_amount',
        'remaining_amount',
        'payment_status',
        'status',
        'created_by_admin_id',
        'notes',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'subtotal' => 0,
        'total_price' => 0,
        'payment_type' => 'full',
        'dp_amount' => 0,
        'remaining_amount' => 0,
        'payment_status' => 'unpaid',
        'status' => 'pending_confirmation',
    ];

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function canBeEdited(): bool
    {
        return $this->status !== 'completed';
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'order_distance_km' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'total_price' => 'decimal:2',
            'dp_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
        ];
    }

    /**
     * @return Attribute<string, string>
     */
    protected function status(): Attribute
    {
        return Attribute::make(
            get: fn (string $value): string => $value === 'processing' ? 'confirmed' : $value,
            set: fn (string $value): string => $value === 'processing' ? 'confirmed' : $value,
        );
    }
}
