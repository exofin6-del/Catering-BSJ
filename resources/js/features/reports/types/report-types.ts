import type { OrderPaymentStatus, OrderStatus } from '@/types';

export type ReportPeriod =
    | 'all'
    | 'custom'
    | 'daily'
    | 'monthly'
    | 'weekly'
    | 'yearly';

export type ReportFilters = {
    end_date: string;
    period: ReportPeriod;
    start_date: string;
};

export type ReportSummary = {
    average_order_value: number;
    highest_order_date: string | null;
    highest_order_value: number;
    order_count: number;
    total_paid: number;
    total_receivable: number;
    total_revenue: number;
};

export type ReportBreakdownRow = {
    count: number;
    total_amount: number;
};

export type ReportPaymentBreakdownRow = {
    count: number;
    method: string;
    total_amount: number;
};

export type ReportPopularItem = {
    id: number | null;
    name: string;
    qty: number;
    revenue: number;
};

export type ReportPayment = {
    amount: number;
    customer_name: string;
    id: number;
    method: string | null;
    order_code: string;
    paid_at: string | null;
    type: string;
};

export type ReportOrderItem = {
    id: number;
    item_type: 'menu_item' | 'package';
    name_snapshot: string;
    price_snapshot: number;
    qty: number;
    subtotal: number;
    selected_items?: Array<{
        package_item_id?: string;
        menu_item_id?: string;
        name?: string;
        price?: number;
        package_item_name?: string;
        primary_image?: string | null;
    }> | null;
    menu_item?: {
        id: number;
        name: string;
        primary_image?: string | null;
        menu_category?: { name: string } | null;
    } | null;
    package?: {
        id: number;
        name: string;
        primary_image?: string | null;
        package_category?: { name: string } | null;
    } | null;
};

export type ReportOrderPayment = {
    id: number;
    amount: number;
    method: string | null;
    type: string;
    paid_at: string | null;
    proof_image?: string | null;
};

export type ReportOrder = {
    address_name?: string | null;
    created_at: string | null;
    customer_name: string;
    event_address?: string | null;
    event_date: string | null;
    event_name: string;
    event_time?: string | null;
    id: number;
    latitude?: string | null;
    longitude?: string | null;
    notes?: string | null;
    phone?: string | null;
    items_count: number;
    items: ReportOrderItem[];
    latest_payment_at: string | null;
    order_code: string;
    paid_amount: number;
    payment_status: OrderPaymentStatus;
    payments: ReportOrderPayment[];
    remaining_amount: number;
    status: OrderStatus;
    subtotal: number;
    total_price: number;
};

export type ReportPageProps = {
    filters: ReportFilters;
    orders: {
        data: ReportOrder[];
        total_orders: number;
    };
    payment_breakdown: ReportPaymentBreakdownRow[];
    popular_menu_items: ReportPopularItem[];
    popular_packages: ReportPopularItem[];
    recent_payments: ReportPayment[];
    status_breakdown: Record<OrderStatus, ReportBreakdownRow>;
    summary: ReportSummary;
};
