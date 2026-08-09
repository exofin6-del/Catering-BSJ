import type { ReactNode } from 'react';

import type {
    DataTableExportChip,
    DataTableServerExport,
    RowReorderContext,
} from '@/components/data-table';
import type {
    MenuPackage,
    PackageCategory,
    PackageImage,
    PackageMenuItem,
    PriceValue,
} from '@/types';
import type { PackageDetailsFormValues } from '../schema/package-form-schema';

export type PaginatedData<T> = {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

export type PackageFilters = {
    category_id: number | null;
    per_page: number;
    per_page_options: number[];
    promo: 'all' | 'no' | 'yes';
    recommended: 'all' | 'no' | 'yes';
    search: string;
    sort_by:
        | 'category'
        | 'manual'
        | 'min_order'
        | 'name'
        | 'price'
        | 'promo'
        | 'recommended'
        | 'status'
        | 'created_at'
        | 'updated_at';
    sort_dir: 'asc' | 'desc';
    status: 'active' | 'all' | 'inactive';
};

export type PackageSortValue =
    | 'category_asc'
    | 'category_desc'
    | 'manual'
    | 'min_order_asc'
    | 'min_order_desc'
    | 'name_asc'
    | 'name_desc'
    | 'price_asc'
    | 'price_desc'
    | 'promo_asc'
    | 'promo_desc'
    | 'recommended_asc'
    | 'recommended_desc'
    | 'status_asc'
    | 'status_desc'
    | 'created_at_asc'
    | 'created_at_desc'
    | 'updated_at_desc';

export type PackageIndexStats = {
    active: number;
    promo: number;
    recommended: number;
    total: number;
};

export type PackageTopOrderedItem = {
    id: number;
    name: string;
    ordered_count: number;
};

export type PackageIndexProps = {
    activityItems?: MenuPackage[];
    filters?: PackageFilters;
    items?: PaginatedData<MenuPackage>;
    packageCategories?: PackageCategory[];
    stats?: PackageIndexStats;
    topOrderedPackages?: PackageTopOrderedItem[];
};

export type PackageFormProps = {
    item?: MenuPackage | null;
    menuItems?: PackageMenuItem[];
    package?: MenuPackage | null;
    packageCategories?: PackageCategory[];
};

export type PackageFormErrors = Record<string, string | undefined>;

export type PackageDetailsFormState = PackageDetailsFormValues;

export type PackageImagePreview = {
    existingId?: PackageImage['id'];
    file?: File;
    id: string;
    isPrimary: boolean;
    isUploading?: boolean;
    name: string;
    temporaryId?: string;
    uploadError?: string;
    url: string;
};

export type TemporaryPackageImageUploadResponse = {
    id: string;
    name: string;
    url: string;
};

export type PackagePriceMode = 'custom' | 'normal' | 'promo';

export type PackageChoiceFormItem = {
    id: string;
    isRecommended: boolean;
    menuItemId: string;
    packagePrice: string;
    priceMode: PackagePriceMode;
};

export type PackageComponentType = 'choice' | 'fixed';

export type PackageComponentFormItem = {
    id: string;
    isRecommended: boolean;
    itemPrices: PackageChoiceFormItem[];
    maxSelect: string;
    menuItemId: string;
    minSelect: string;
    name: string;
    packagePrice: string;
    priceMode: PackagePriceMode;
    type: PackageComponentType;
};

export type PackageComponentPayload = {
    is_recommended: boolean;
    item_prices?: {
        is_recommended: boolean;
        menu_item_id: number;
        package_price: string | null;
    }[];
    max_select?: number | null;
    menu_item_id?: number | null;
    min_select?: number | null;
    name: string | null;
    package_price?: string | null;
};

export type PackagePreviewComponent = {
    activePrice: PriceValue;
    hasDiscount: boolean;
    id: string;
    isChoice: boolean;
    name: string;
    menuItemId?: string;
    options: {
        activePrice: PriceValue;
        hasDiscount: boolean;
        id: string;
        isRecommended: boolean;
        name: string;
        originalPrice: PriceValue;
        menuItemId?: string;
    }[];
    originalPrice: PriceValue;
};

export type PackagePreviewState = {
    categoryName: string;
    components: PackagePreviewComponent[];
    description: string;
    galleryImages: {
        alt: string;
        id: string;
        isPrimary: boolean;
        url: string;
    }[];
    isActive: boolean;
    isRecommended: boolean;
    minOrder: string;
    name: string;
    primaryImage: string | null;
    totalActivePrice: number;
    totalHasDiscount: boolean;
    totalPrice: number;
    totalStartsFrom: boolean;
};

export type PackageTableProps = {
    appendLoadingRowCount?: number;
    canMove?: boolean;
    chips?: DataTableExportChip[];
    items: MenuPackage[];
    isLoading?: boolean;
    onActiveChange?: (item: MenuPackage, isActive: boolean) => void;
    onDelete?: (item: MenuPackage) => void;
    onEdit?: (item: MenuPackage) => void;
    onMove?: (item: MenuPackage, direction: 'up' | 'down') => void;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onReorder?: (
        items: MenuPackage[],
        context: RowReorderContext<MenuPackage>,
    ) => void;
    onSearchChange?: (value: string) => void;
    onView?: (item: MenuPackage) => void;
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    searchValue?: string;
    showSearch?: boolean;
    serverExport?: DataTableServerExport;
    toolbar?: ReactNode;
    totalItems?: number;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
};
