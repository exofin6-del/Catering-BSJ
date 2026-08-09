<?php

namespace App\Http\Requests\Menu;

use App\Models\MenuItem;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderMenuItemsRequest extends FormRequest
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
            'ids' => ['required_without:moved_id', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', Rule::exists(MenuItem::class, 'id')],
            'moved_id' => ['required_without:ids', 'integer', Rule::exists(MenuItem::class, 'id')],
            'target_sort_order' => ['required_with:moved_id', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<int, int>
     */
    public function menuItemIds(): array
    {
        $ids = $this->validated('ids', []);

        return collect(is_array($ids) ? $ids : [])
            ->map(fn (int|string $id): int => (int) $id)
            ->values()
            ->all();
    }

    public function movedMenuItemId(): ?int
    {
        $id = $this->validated('moved_id', null);

        return is_numeric($id) ? (int) $id : null;
    }

    public function targetSortOrder(): ?int
    {
        $sortOrder = $this->validated('target_sort_order', null);

        return is_numeric($sortOrder) ? (int) $sortOrder : null;
    }
}
