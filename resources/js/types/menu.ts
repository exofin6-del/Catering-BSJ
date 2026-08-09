export type MenuUser = {
    id: number;
    name: string;
};

export type MenuCategory = {
    id: number;
    name: string;
    slug?: string;
    icon?: string | null;
    is_active?: boolean;
    sort_order?: number;
    menu_items_count?: number;
    package_items_count?: number;
    created_at?: string | null;
    updated_at?: string | null;
};

export type MenuImage = {
    id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
};

export type MenuItem = {
    id?: number;
    name: string;
    slug?: string;
    base_price: number | string;
    price?: number | string | null;
    promo_price?: number | string | null;
    description?: string | null;
    min_order?: number;
    is_recommended?: boolean;
    sort_order?: number;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    creator?: MenuUser | null;
    updater?: MenuUser | null;
    primary_image?: string | null;
    images?: MenuImage[];
    menu_category?: MenuCategory | null;
    package_items_count?: number;
    order_items_count?: number;
    usage_count?: number;
    usage_label?: string;
};
