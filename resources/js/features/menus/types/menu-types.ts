import type { ReactNode } from 'react';

import type {
    DataTableExportChip,
    DataTableServerExport,
    RowReorderContext,
} from '@/components/data-table';
import type { MenuCategory, MenuItem } from '@/types';

export type PaginatedData<T> = {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

export type MenuFilters = {
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

export type MenuSortValue =
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

export type MenuIndexStats = {
    active: number;
    promo: number;
    recommended: number;
    total: number;
    uncategorized: number;
};

export type MenuTopOrderedItem = {
    id: number;
    name: string;
    ordered_count: number;
};

export type MenuIndexProps = {
    activityItems?: MenuItem[];
    categories?: MenuCategory[];
    filters?: MenuFilters;
    items?: PaginatedData<MenuItem>;
    stats?: MenuIndexStats;
    topOrderedItems?: MenuTopOrderedItem[];
};

export type MenuFormProps = {
    categories?: MenuCategory[];
    item?: MenuItem | null;
};

export type MenuFormErrors = Record<string, string | undefined>;

export type MenuFormState = {
    basePrice: string;
    categoryId: string;
    categoryName: string;
    description: string;
    isActive: boolean;
    isRecommended: boolean;
    minOrder: string;
    name: string;
    promoPrice: string;
    slug: string;
};

export type MenuImagePreview = {
    existingId?: number;
    file?: File;
    id: string;
    isPrimary: boolean;
    isUploading?: boolean;
    name: string;
    uploadStage?: 'compressing' | 'uploading';
    temporaryId?: string;
    uploadError?: string;
    url: string;
};

export type TemporaryImageUploadResponse = {
    id: string;
    name: string;
    url: string;
};

export type MenuPreviewGalleryImage = {
    alt: string;
    id: string;
    isPrimary: boolean;
    url: string;
};

export type MenuPreviewState = {
    basePrice: string;
    categoryName: string;
    activityDate: string;
    activityType: 'created' | 'updated';
    activityUserName: string;
    createdAt?: string | null;
    createdByName?: string;
    description: string;
    galleryImages?: MenuPreviewGalleryImage[];
    isActive: boolean;
    isRecommended: boolean;
    minOrder: string;
    name: string;
    promoPrice: string;
    primaryImage: string | null;
    updatedAt?: string | null;
    updatedByName?: string;
};

export type MenuDisplayData = {
    auditItems: {
        date: string;
        label: string;
        userName: string;
    }[];
    description: string;
    fallbackImageLabel: string;
    images: MenuPreviewGalleryImage[];
    isActive: boolean;
    isRecommended: boolean;
    minOrder: string;
    name: string;
    price: {
        activePrice: string;
        hasDiscount: boolean;
        originalPrice: string;
    };
    primaryImage: string | null;
    subtitle: string;
};

export type MenuTableProps = {
    appendLoadingRowCount?: number;
    canMove?: boolean;
    items: MenuItem[];
    isLoading?: boolean;
    onActiveChange?: (item: MenuItem, isActive: boolean) => void;
    onDelete?: (item: MenuItem) => void;
    onEdit?: (item: MenuItem) => void;
    onMove?: (item: MenuItem, direction: 'up' | 'down') => void;
    onView?: (item: MenuItem) => void;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onReorder?: (
        items: MenuItem[],
        context: RowReorderContext<MenuItem>,
    ) => void;
    onSearchChange?: (value: string) => void;
    pageCount?: number;
    pageIndex?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    rowNumberOffset?: number;
    searchValue?: string;
    selectedItemId?: number;
    showSearch?: boolean;
    totalItems?: number;
    toolbar?: ReactNode;
    visibleItemFrom?: number | null;
    visibleItemTo?: number | null;
    chips?: DataTableExportChip[];
    serverExport?: DataTableServerExport;
};

export type ResolvedMenuPrice = {
    displayPrice: MenuItem['base_price'];
    hasPromo: boolean;
    originalPrice: MenuItem['base_price'];
    promoPrice: MenuItem['promo_price'];
    sortValue: number;
};

export type MenuActivityProps = {
    categories: MenuCategory[];
    items: MenuItem[];
    stats?: MenuActivityStats;
};

export type MenuActivityStats = {
    active: number;
    promo: number;
    recommended: number;
    total: number;
    uncategorized: number;
};

export type MenuInsight = {
    label: string;
    value: number;
};

export type MenuActivityItem = {
    id: string;
    item: MenuItem;
    time: Date;
    type: 'created' | 'updated';
    userName: string;
};
