<?php

namespace App\Actions\Admin\Menu;

use Illuminate\Database\Eloquent\Builder;

class MenuItemFilters
{
    /**
     * Normalisasi filter request menjadi bentuk yang
     * dikonsumsi halaman index dan endpoint export.
     *
     * @param  array<string, mixed>  $filters
     * @return array{search: string, per_page: int, per_page_options: array<int, int>, category_id: int|null, status: string, recommended: string, promo: string, sort_by: string, sort_dir: string}
     */
    public function normalize(array $filters): array
    {
        return [
            'search' => trim(
                (string) ($filters['search'] ?? '')
            ),

            'per_page' => $this->normalizePerPage(
                $filters['per_page'] ?? null
            ),

            'per_page_options' => self::PER_PAGE_OPTIONS,

            'category_id' => $this->normalizeCategoryId(
                $filters['category_id'] ?? null
            ),

            'status' => $this->normalizeChoice(
                $filters['status'] ?? null,
                ['all', 'active', 'inactive'],
                'all'
            ),

            'recommended' => $this->normalizeChoice(
                $filters['recommended'] ?? null,
                ['all', 'yes', 'no'],
                'all'
            ),

            'promo' => $this->normalizeChoice(
                $filters['promo'] ?? null,
                ['all', 'yes', 'no'],
                'all'
            ),

            'sort_by' => $this->normalizeSortBy(
                $filters['sort_by'] ?? null
            ),

            'sort_dir' => ($filters['sort_dir'] ?? 'asc') === 'desc'
                ? 'desc'
                : 'asc',
        ];
    }

    /**
     * Terapkan filter ter-normalisasi ke query menu item.
     *
     * @param  array<string, mixed>  $filters
     */
    public function apply(
        Builder $query,
        array $filters,
    ): void {
        $this->search($query, $filters);
        $this->category($query, $filters);
        $this->status($query, $filters);
        $this->recommended($query, $filters);
        $this->promo($query, $filters);
    }

    private const PER_PAGE_OPTIONS = [
        10,
        25,
        50,
        100,
    ];

    private const SORT_BY_OPTIONS = [
        'manual',
        'name',
        'category',
        'min_order',
        'price',
        'status',
        'recommended',
        'promo',
        'created_at',
        'updated_at',
    ];

    private const CHOICES = [
        'status' => ['all', 'active', 'inactive'],
        'recommended' => ['all', 'yes', 'no'],
        'promo' => ['all', 'yes', 'no'],
    ];

    /**
     * @param  array<string, mixed>  $filters
     */
    private function search(
        Builder $query,
        array $filters,
    ): void {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search === '') {
            return;
        }

        $query->where(function (Builder $query) use ($search): void {
            $query
                ->where('menu_items.name', 'like', "%{$search}%")
                ->orWhere('menu_items.description', 'like', "%{$search}%")
                ->orWhere('menu_categories.name', 'like', "%{$search}%");
        });
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function category(
        Builder $query,
        array $filters,
    ): void {
        if (! filled($filters['category_id'] ?? null)) {
            return;
        }

        $query->where(
            'menu_items.menu_category_id',
            $filters['category_id']
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function status(
        Builder $query,
        array $filters,
    ): void {
        if (($filters['status'] ?? 'all') === 'all') {
            return;
        }

        $query->where(
            'menu_items.is_active',
            $filters['status'] === 'active'
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function recommended(
        Builder $query,
        array $filters,
    ): void {
        if (($filters['recommended'] ?? 'all') === 'all') {
            return;
        }

        $query->where(
            'menu_items.is_recommended',
            $filters['recommended'] === 'yes'
        );
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function promo(
        Builder $query,
        array $filters,
    ): void {
        if (($filters['promo'] ?? 'all') === 'all') {
            return;
        }

        if ($filters['promo'] === 'yes') {
            $query->whereNotNull('menu_items.promo_price');

            return;
        }

        $query->whereNull('menu_items.promo_price');
    }

    private function normalizePerPage(mixed $value): int
    {
        $value = (int) $value;

        return in_array($value, self::PER_PAGE_OPTIONS, true)
            ? $value
            : self::PER_PAGE_OPTIONS[0];
    }

    private function normalizeCategoryId(mixed $value): ?int
    {
        if (! filled($value) || ! is_numeric($value)) {
            return null;
        }

        $categoryId = (int) $value;

        return $categoryId > 0 ? $categoryId : null;
    }

    /**
     * @param  array<int, string>  $allowed
     */
    private function normalizeChoice(
        mixed $value,
        array $allowed,
        string $default,
    ): string {
        return in_array($value, $allowed, true)
            ? (string) $value
            : $default;
    }

    private function normalizeSortBy(mixed $value): string
    {
        return in_array($value, self::SORT_BY_OPTIONS, true)
            ? (string) $value
            : 'manual';
    }
}
