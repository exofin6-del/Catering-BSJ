<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuImage extends Model
{
    public const MaxImagesPerMenuItem = 5;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'menu_item_id',
        'image_url',
        'cloudinary_public_id',
        'is_primary',
        'sort_order',
    ];

    /**
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_primary' => false,
        'sort_order' => 0,
    ];

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
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}
