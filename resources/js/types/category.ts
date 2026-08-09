export type CategoryType = 'menu' | 'paket';

export type CategoryFilterType = CategoryType | 'all';

export type CategoryRecord = {
    id: number;
    key: string;
    type: CategoryType;
    type_label: string;
    name: string;
    slug: string;
    icon?: string | null;
    is_active: boolean;
    sort_order: number;
    menu_items_count: number;
    package_items_count: number;
    packages_count: number;
    usage_count: number;
    usage_label: string;
    created_at?: string | null;
    updated_at?: string | null;
};
