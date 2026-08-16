<?php

namespace App\Http\Requests\Menu;

use App\Models\MenuCategory;
use App\Models\MenuImage;
use App\Models\MenuItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class UpdateMenuItemRequest extends FormRequest
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
            'menu_category_id' => ['sometimes', 'nullable', 'integer', Rule::exists(MenuCategory::class, 'id')],
            'menu_category_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'menu_category_icon' => ['sometimes', 'nullable', 'string', 'max:80'],
            'menu_category_ids' => ['sometimes', 'nullable', 'array'],
            'menu_category_ids.*' => ['integer', 'distinct', Rule::exists(MenuCategory::class, 'id')],
            'menu_category_names' => ['sometimes', 'nullable', 'array'],
            'menu_category_names.*' => ['string', 'max:255', 'distinct'],
            'name' => ['sometimes', 'string', 'max:255'],
            'base_price' => ['sometimes', 'numeric', 'min:0'],
            'promo_price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'lte:base_price'],
            'description' => ['sometimes', 'nullable', 'string'],
            'min_order' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_recommended' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'image' => ['sometimes', 'nullable', File::image()->max((int) config('cloudinary.max_upload_kilobytes', 20 * 1024))],
            'temporary_image_id' => ['sometimes', 'nullable', 'string'],
            'temporary_image_ids' => ['sometimes', 'nullable', 'array', 'max:'.MenuImage::MaxImagesPerMenuItem],
            'temporary_image_ids.*' => ['string', 'distinct'],
            'primary_temporary_image_id' => ['sometimes', 'nullable', 'string'],
            'primary_image_id' => ['sometimes', 'nullable', 'integer'],
            'removed_image_ids' => ['sometimes', 'nullable', 'array', 'max:'.MenuImage::MaxImagesPerMenuItem],
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

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validateImageLimit($validator);
            },
        ];
    }

    public function image(): ?UploadedFile
    {
        $image = $this->file('image');

        return $image instanceof UploadedFile ? $image : null;
    }

    private function validateImageLimit(Validator $validator): void
    {
        if (
            $validator->errors()->has('image')
            || $validator->errors()->has('removed_image_ids')
            || $validator->errors()->has('temporary_image_ids')
        ) {
            return;
        }

        $menuItem = $this->route('menuItem');

        if (! $menuItem instanceof MenuItem) {
            return;
        }

        $remainingImageCount = $menuItem
            ->images()
            ->pluck('id')
            ->diff($this->removedImageIds())
            ->count();
        $newImageCount = $this->hasFile('image')
            ? 1
            : $this->temporaryImageIds()->count();

        if ($remainingImageCount + $newImageCount <= MenuImage::MaxImagesPerMenuItem) {
            return;
        }

        $validator->errors()->add(
            'temporary_image_ids',
            __('Maksimal :max gambar per menu. Hapus gambar lama dulu sebelum menambahkan gambar baru.', [
                'max' => MenuImage::MaxImagesPerMenuItem,
            ]),
        );
    }

    /**
     * @return Collection<int, int>
     */
    private function removedImageIds(): Collection
    {
        $removedImageIds = $this->input('removed_image_ids', []);

        if (! is_array($removedImageIds)) {
            return collect();
        }

        return collect($removedImageIds)
            ->filter(fn (mixed $id): bool => is_numeric($id))
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values();
    }

    /**
     * @return Collection<int, string>
     */
    private function temporaryImageIds(): Collection
    {
        $temporaryImageIds = $this->input('temporary_image_ids', []);

        if (is_array($temporaryImageIds)) {
            $temporaryImageIds = collect($temporaryImageIds)
                ->filter(fn (mixed $id): bool => is_string($id) && $id !== '')
                ->unique()
                ->values();

            if ($temporaryImageIds->isNotEmpty()) {
                return $temporaryImageIds;
            }
        }

        $legacyTemporaryImageId = $this->input('temporary_image_id');

        return is_string($legacyTemporaryImageId) && $legacyTemporaryImageId !== ''
            ? collect([$legacyTemporaryImageId])
            : collect();
    }
}
