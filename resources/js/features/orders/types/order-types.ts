import type { ReactNode } from 'react';

import type {
    DataTableExportChip,
    DataTableServerExport,
} from '@/components/data-table';
import type {
    Order,
    OrderBusinessSetting,
    OrderItemType,
    OrderMenuItem,
    OrderPackage,
    OrderPaymentStatus,
    OrderPaymentType,
    OrderStatus,
} from '@/types';

export type PaginatedData<T> = {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
};

export type OrderFilters = {
    event_date_from: string | null;
    event_date_to: string | null;
    payment_status: OrderPaymentStatus | 'all';
    payment_type: OrderPaymentType | 'all';
    per_page: number;
    per_page_options: number[];
    search: string;
    sort_by:
        | 'created_at'
        | 'updated_at'
        | 'event_date'
        | 'customer_name'
        | 'total_price'
        | 'status'
        | 'payment_status';
    sort_dir: 'asc' | 'desc';
    status: OrderStatus | 'all';
};

export type OrderIndexStats = {
    canceled: number;
    completed: number;
    confirmed: number;
    dp_paid: number;
    paid: number;
    pending_confirmation: number;
    total: number;
    unpaid: number;
};

export type OrderIndexProps = {
    activityItems?: Order[];
    filters?: OrderFilters;
    items?: PaginatedData<Order>;
    order?: Order | null;
    stats?: OrderIndexStats;
};

export type OrderFormSelectedItem = {
    menu_item_id: string;
    package_item_id: string;
};

export type OrderFormItem = {
    item_type: OrderItemType;
    menu_item_id: string;
    package_id: string;
    qty: string;
    selected_items: OrderFormSelectedItem[];
};

export type OrderFormData = {
    address_name: string;
    customer_name: string;
    event_address: string;
    event_date: string;
    event_name: string;
    event_time: string;
    is_paid_in_full: boolean;
    items: OrderFormItem[];
    latitude: string;
    longitude: string;
    notes: string;
    payment_amount: string;
    payment_method: '' | 'transfer' | 'cash';
    payment_paid_at: string;
    proof_image: File | null;
    payment_type: '' | OrderPaymentType;
    phone: string;
    status: OrderStatus;
};

export type OrderFormProps = {
    businessSetting?: OrderBusinessSetting | null;
    menuItems?: OrderMenuItem[];
    order?: Order | null;
    packages?: OrderPackage[];
    submitLabel?: string;
};

export type OrderTableProps = {
    appendLoadingRowCount?: number;
    chips?: DataTableExportChip[];
    items: Order[];
    isLoading?: boolean;
    onDelete?: (item: Order) => void;
    onEdit?: (item: Order) => void;
    onPageChange?: (pageIndex: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onSearchChange?: (value: string) => void;
    onStatusChange?: (item: Order, status: OrderStatus) => void;
    onView?: (item: Order) => void;
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
