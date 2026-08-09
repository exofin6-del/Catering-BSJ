<?php

namespace App\Http\Requests\Menu;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreMenuItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'menu_category_id' => ['nullable', 'integer', Rule::exists(MenuCategory::class, 'id')],
            'menu_category_name' => ['nullable', 'string', 'max:255'],
            'menu_category_icon' => ['nullable', 'string', 'max:80'],
            'menu_category_ids' => ['nullable', 'array'],
            'menu_category_ids.*' => ['integer', 'distinct', Rule::exists(MenuCategory::class, 'id')],
            'menu_category_names' => ['nullable', 'array'],
            'menu_category_names.*' => ['string', 'max:255', 'distinct'],
            'name' => ['required', 'string', 'max:255'],
            'base_price' => ['required', 'numeric', 'min:0'],
            'promo_price' => ['nullable', 'numeric', 'min:0', 'lte:base_price'],
            'description' => ['nullable', 'string'],
            'min_order' => ['nullable', 'integer', 'min:1'],
            'is_recommended' => ['sometimes', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['nullable', File::image()->max('2mb')],
            'temporary_image_id' => ['nullable', 'string'],
            'temporary_image_ids' => ['nullable', 'array', 'max:'.MenuImage::MaxImagesPerMenuItem],
            'temporary_image_ids.*' => ['string', 'distinct'],
            'primary_temporary_image_id' => ['nullable', 'string'],
            'primary_image_id' => ['nullable', 'integer'],
            'removed_image_ids' => ['nullable', 'array', 'max:'.MenuImage::MaxImagesPerMenuItem],
            'removed_image_ids.*' => ['integer', 'distinct'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'removed_image_ids.max' => __('Maksimal :max gambar dapat dihapus sekaligus.', [
                'max' => MenuImage::MaxImagesPerMenuItem,
            ]),
            'temporary_image_ids.max' => __('Maksimal :max gambar per menu.', [
                'max' => MenuImage::MaxImagesPerMenuItem,
            ]),
        ];
    }

    public function image(): ?UploadedFile
    {
        $image = $this->file('image');

        return $image instanceof UploadedFile ? $image : null;
    }
}
