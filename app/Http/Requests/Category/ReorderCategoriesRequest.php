<?php

namespace App\Http\Requests\Category;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ReorderCategoriesRequest extends FormRequest
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
            'type' => ['required_with:moved_id', 'string', 'in:menu,paket'],
            'ids' => ['required_without:moved_id', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct'], // Validation for exact existence across tables is complex in rules, handle in action if needed
            'moved_id' => ['required_without:ids', 'integer'],
            'target_sort_order' => ['required_with:moved_id', 'integer', 'min:1'],
        ];
    }

    public function type(): ?string
    {
        $type = $this->validated('type', null);

        return is_string($type) ? $type : null;
    }

    /**
     * @return array<int, int>
     */
    public function categoryIds(): array
    {
        $ids = $this->validated('ids', []);

        return collect(is_array($ids) ? $ids : [])
            ->map(fn (int|string $id): int => (int) $id)
            ->values()
            ->all();
    }

    public function movedCategoryId(): ?int
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
