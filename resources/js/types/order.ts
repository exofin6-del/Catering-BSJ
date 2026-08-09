import type { PriceValue } from './package';

export type OrderStatus =
    | 'pending_confirmation'
    | 'confirmed'
    | 'completed'
    | 'canceled';

export type OrderPaymentStatus = 'unpaid' | 'dp_paid' | 'paid';

export type OrderPaymentType = 'dp' | 'full';

export type OrderItemType = 'menu_item' | 'package';

export type OrderAdmin = {
    id: number;
    name: string;
};

export type OrderBusinessSetting = {
    business_name?: string;
    business_lat?: PriceValue;
    business_lng?: PriceValue;
    max_order_km?: PriceValue;
    max_orders_per_day?: PriceValue;
    operational_start_time?: string;
    operational_end_time?: string;
    is_open?: boolean;
};

export type OrderMenuItem = {
    id: number;
    base_price: PriceValue;
    description?: string | null;
    is_recommended?: boolean;
    menu_category?: {
        id: number;
        icon?: string | null;
        name: string;
    } | null;
    min_order?: number;
    name: string;
    price?: PriceValue;
    primary_image?: string | null;
    promo_price?: PriceValue;
};

export type OrderPackageMenuItem = {
    id: number;
    base_price?: PriceValue;
    name: string;
    primary_image?: string | null;
    promo_price?: PriceValue;
};

export type OrderPackageChoice = {
    id: number;
    is_recommended?: boolean;
    menu_item?: OrderPackageMenuItem | null;
    menu_item_id: number;
    package_price: PriceValue;
};

export type OrderPackageItem = {
    id: number;
    item_prices: OrderPackageChoice[];
    is_recommended?: boolean;
    max_select?: number | null;
    menu_item?: OrderPackageMenuItem | null;
    menu_item_id?: number | null;
    min_select?: number | null;
    name: string;
    package_price?: PriceValue;
};

export type OrderPackage = {
    id: number;
    description?: string | null;
    is_recommended?: boolean;
    items: OrderPackageItem[];
    min_order?: number;
    name: string;
    package_category?: {
        id: number;
        icon?: string | null;
        name: string;
    } | null;
    price: PriceValue;
    primary_image?: string | null;
};

export type OrderSelectedItemSnapshot = {
    menu_item_id?: number | null;
    name?: string | null;
    package_item_id?: number | null;
    package_item_name?: string | null;
    price: PriceValue;
};

export type OrderItem = {
    id: number;
    item_type: OrderItemType;
    menu_item?: OrderMenuItem | null;
    menu_item_id?: number | null;
    name_snapshot: string;
    order_id: number;
    package?: OrderPackage | null;
    package_id?: number | null;
    price_snapshot: PriceValue;
    qty: number;
    selected_items?: OrderSelectedItemSnapshot[] | null;
    subtotal: PriceValue;
};

export type OrderPayment = {
    amount: PriceValue;
    created_at?: string | null;
    id: number;
    method: 'transfer' | 'cash' | 'manual' | string;
    notes?: string | null;
    order_id?: number;
    paid_at?: string | null;
    proof_image?: string | null;
    type: 'dp' | 'full' | 'remaining' | string;
};

export type Order = {
    address_name?: string | null;
    can_edit: boolean;
    created_at?: string | null;
    created_by_admin?: OrderAdmin | null;
    customer_name: string;
    dp_amount: PriceValue;
    event_address?: string | null;
    event_date: string;
    event_name: string;
    event_time?: string | null;
    id: number;
    items: OrderItem[];
    latitude?: PriceValue;
    longitude?: PriceValue;
    notes?: string | null;
    order_code: string;
    order_distance_km?: PriceValue;
    payment_status: OrderPaymentStatus;
    payment_type: OrderPaymentType;
    payments: OrderPayment[];
    phone: string;
    remaining_amount: PriceValue;
    status: OrderStatus;
    subtotal: PriceValue;
    total_price: PriceValue;
    updated_at?: string | null;
};
