import type { CustomerTheme } from '@/features/customers/types/customer-theme';

export type BusinessSetting = {
    business_name: string;
    description: string | null;
    whatsapp_number: string | null;
    business_lat: string | null;
    business_lng: string | null;
    business_address: string | null;
    max_order_km: string;
    max_orders_per_day: number;
    operational_start_time: string;
    operational_end_time: string;
    is_open: boolean;
    customer_theme: CustomerTheme;
    hero_images: string[];
};

export type InfoFormData = {
    business_name: string;
    description: string;
    whatsapp_number: string;
    is_open: boolean;
};

export type ThemeFormData = {
    customer_theme: CustomerTheme;
};

export type HoursFormData = {
    operational_start_time: string;
    operational_end_time: string;
    max_orders_per_day: number;
};

export type AreaFormData = {
    business_lat: string;
    business_lng: string;
    business_address: string;
    max_order_km: number;
};
