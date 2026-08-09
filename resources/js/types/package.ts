import type { MenuCategory, MenuUser } from './menu';

export type PriceValue = number | string | null | undefined;

export type PackageCategory = {
    id: number;
    name: string;
    slug?: string;
    icon?: string | null;
    is_active?: boolean;
    sort_order?: number;
    packages_count?: number;
    created_at?: string | null;
    updated_at?: string | null;
};

export type PackageImage = {
    id: number;
    image_url: string;
    is_primary: boolean;
    sort_order: number;
};

export type PackageMenuItem = {
    id: number;
    menu_category_id?: number | null;
    name: string;
    slug?: string;
    base_price: PriceValue;
    promo_price?: PriceValue;
    min_order?: number;
    is_recommended?: boolean;
    is_active?: boolean;
    primary_image?: string | null;
    menu_category?: MenuCategory | null;
};

export type PackageItemPrice = {
    id: number;
    menu_item_id: number;
    package_price: PriceValue;
    is_recommended: boolean;
    menu_item?: PackageMenuItem | null;
};

export type PackageItem = {
    id: number;
    name?: string | null;
    menu_item_id?: number | null;
    menu_category_id?: number | null;
    package_price: PriceValue;
    is_recommended: boolean;
    min_select?: number | null;
    max_select?: number | null;
    sort_order?: number;
    menu_item?: PackageMenuItem | null;
    menu_category?: MenuCategory | null;
    item_prices: PackageItemPrice[];
};

export type MenuPackage = {
    id?: number;
    package_category_id?: number | null;
    name: string;
    slug?: string;
    price: PriceValue;
    min_order?: number;
    description?: string | null;
    primary_image?: string | null;
    images?: PackageImage[];
    is_recommended?: boolean;
    sort_order?: number;
    is_active?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    creator?: MenuUser | null;
    updater?: MenuUser | null;
    package_category?: PackageCategory | null;
    menu_item_ids?: number[];
    items_count: number;
    items: PackageItem[];
};

export type PackagePageProps = {
    activityItems?: MenuPackage[];
    filters?: Record<string, unknown>;
    items?: {
        current_page: number;
        data: MenuPackage[];
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
    };
    menuItems?: PackageMenuItem[];
    package?: MenuPackage | null;
    packageCategories?: PackageCategory[];
    stats?: {
        active: number;
        promo: number;
        recommended: number;
        total: number;
    };
    topOrderedPackages?: {
        id: number;
        name: string;
        ordered_count: number;
    }[];
};
