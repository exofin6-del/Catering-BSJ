<?php

namespace App\Http\Requests\Paket;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\PackageCategory;
use App\Models\PackageImage;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

abstract class PackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function packageRules(bool $isUpdate): array
    {
        $sometimes = $isUpdate ? ['sometimes'] : [];
        $requiredName = $isUpdate ? ['sometimes', 'string'] : ['required', 'string'];
        $requiredComponents = $isUpdate ? ['sometimes', 'array', 'min:1'] : ['required', 'array', 'min:1'];

        return [
            'name' => [...$requiredName, 'max:255'],
            'package_category_id' => [...$sometimes, 'nullable', 'integer', Rule::exists(PackageCategory::class, 'id')->where('is_active', true)],
            'package_category_name' => [...$sometimes, 'nullable', 'string', 'max:255'],
            'package_category_icon' => [...$sometimes, 'nullable', 'string', 'max:80'],
            'price' => [...$sometimes, 'nullable', 'numeric', 'min:0'],
            'min_order' => [...$sometimes, 'nullable', 'integer', 'min:1'],
            'description' => [...$sometimes, 'nullable', 'string'],
            'is_recommended' => [...$sometimes, 'boolean'],
            'sort_order' => [...$sometimes, 'nullable', 'integer', 'min:0'],
            'is_active' => [...$sometimes, 'boolean'],
            'package_components' => $requiredComponents,
            'package_components.*' => ['array:name,menu_item_id,menu_category_id,package_price,is_recommended,min_select,max_select,item_prices'],
            'package_components.*.name' => ['nullable', 'string', 'max:255'],
            'package_components.*.menu_item_id' => [
                'nullable',
                'integer',
                Rule::exists(MenuItem::class, 'id')->where('is_active', true),
            ],
            'package_components.*.menu_category_id' => [
                'nullable',
                'integer',
                Rule::exists(MenuCategory::class, 'id')->where('is_active', true),
            ],
            'package_components.*.package_price' => ['nullable', 'numeric', 'min:0'],
            'package_components.*.is_recommended' => ['sometimes', 'boolean'],
            'package_components.*.min_select' => ['nullable', 'integer', 'min:0'],
            'package_components.*.max_select' => ['nullable', 'integer', 'min:1'],
            'package_components.*.item_prices' => ['nullable', 'array'],
            'package_components.*.item_prices.*' => ['array:menu_item_id,package_price,is_recommended'],
            'package_components.*.item_prices.*.menu_item_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists(MenuItem::class, 'id')->where('is_active', true),
            ],
            'package_components.*.item_prices.*.package_price' => ['nullable', 'numeric', 'min:0'],
            'package_components.*.item_prices.*.is_recommended' => ['sometimes', 'boolean'],
            'temporary_image_ids' => [...$sometimes, 'nullable', 'array', 'max:5'],
            'temporary_image_ids.*' => ['string', 'distinct'],
            'primary_temporary_image_id' => [...$sometimes, 'nullable', 'string'],
            'primary_image_id' => [...$sometimes, 'nullable', 'integer', Rule::exists(PackageImage::class, 'id')],
            'removed_image_ids' => [...$sometimes, 'nullable', 'array', 'max:5'],
            'removed_image_ids.*' => ['integer', 'distinct', Rule::exists(PackageImage::class, 'id')],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $this->validatePackageComponents($validator);
            },
        ];
    }

    private function validatePackageComponents(Validator $validator): void
    {
        $components = $this->input('package_components');

        if (! is_array($components)) {
            return;
        }

        $menuItemIds = collect($components)
            ->flatMap(function (array $component) {
                $ids = [(int) ($component['menu_item_id'] ?? 0)];
                foreach ($component['item_prices'] ?? [] as $price) {
                    $ids[] = (int) ($price['menu_item_id'] ?? 0);
                }

                return $ids;
            })
            ->filter()
            ->unique();

        $menuItemPrices = MenuItem::whereIn('id', $menuItemIds)->pluck('base_price', 'id');

        foreach ($components as $index => $component) {
            if (! is_array($component)) {
                continue;
            }

            if (filled($component['menu_item_id'] ?? null) && filled($component['menu_category_id'] ?? null)) {
                $validator->errors()->add(
                    "package_components.$index.menu_category_id",
                    __('Choose either a menu item or a menu category, not both.'),
                );
            }

            $menuItemId = $component['menu_item_id'] ?? null;
            $packagePrice = $component['package_price'] ?? null;
            if ($menuItemId && $packagePrice !== null) {
                $basePrice = $menuItemPrices->get($menuItemId);
                if ($packagePrice > $basePrice) {
                    $validator->errors()->add(
                        "package_components.$index.package_price",
                        __('The package price cannot be greater than the menu base price (:price).', ['price' => number_format($basePrice, 0, ',', '.')]),
                    );
                }
            }

            $itemPrices = $component['item_prices'] ?? [];
            $isSelectableGroup = $this->isSelectableGroupComponent($component, $itemPrices);

            if (! $isSelectableGroup) {
                if (empty($component['menu_item_id'])) {
                    $validator->errors()->add("package_components.$index.menu_item_id", __('The menu item field is required for fixed items.'));
                }

                continue;
            }

            if (! is_array($itemPrices) || count($itemPrices) === 0) {
                $validator->errors()->add("package_components.$index.item_prices", __('Add at least one choice item.'));
            } else {
                foreach ($itemPrices as $priceIndex => $price) {
                    $choiceMenuItemId = $price['menu_item_id'] ?? null;
                    $choicePackagePrice = $price['package_price'] ?? null;
                    if ($choiceMenuItemId && $choicePackagePrice !== null) {
                        $basePrice = $menuItemPrices->get($choiceMenuItemId);
                        if ($choicePackagePrice > $basePrice) {
                            $validator->errors()->add(
                                "package_components.$index.item_prices.$priceIndex.package_price",
                                __('The package price cannot be greater than the menu base price (:price).', ['price' => number_format($basePrice, 0, ',', '.')]),
                            );
                        }
                    }
                }
            }

            $minSelect = (int) ($component['min_select'] ?? 0);
            $maxSelect = (int) ($component['max_select'] ?? 0);

            if ($maxSelect > 0 && $minSelect > $maxSelect) {
                $validator->errors()->add("package_components.$index.max_select", __('The maximum selection must be greater than or equal to the minimum selection.'));
            }
        }
    }

    /**
     * @param  array<string, mixed>  $component
     */
    private function isSelectableGroupComponent(array $component, mixed $itemPrices): bool
    {
        return filled($component['menu_category_id'] ?? null)
            || array_key_exists('min_select', $component)
            || array_key_exists('max_select', $component)
            || array_key_exists('item_prices', $component)
            || (is_array($itemPrices) && $itemPrices !== []);
    }
}
