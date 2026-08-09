import type { PaginatedData } from '@/features/orders/types/order-types';
import type { Order, OrderPaymentStatus } from '@/types';

export type ScheduleListItem = {
    id: string;
    image_url: string | null;
    name: string;
    package_name: string | null;
    qty: number;
    source: 'direct' | 'package_content' | string;
};

export type ScheduleItem = Omit<Order, 'items'> & {
    items: ScheduleListItem[];
    order_items: Order['items'];
    schedule_state: 'today' | 'upcoming' | 'overdue';
};

export type ScheduleDay = {
    date: string;
    day_name: string;
    day_number: string;
    id: string;
    is_selected: boolean;
    is_today: boolean;
    label: string;
    month_label: string;
    schedules_count: number;
};

export type ScheduleFilters = {
    export_period: 'month' | 'all';
    month: string;
    payment_status: OrderPaymentStatus | 'all' | 'ready';
    scope: 'all' | 'day';
    search: string;
    selected_date: string | null;
};

export type ScheduleStats = {
    overdue: number;
    today: number;
    total: number;
    upcoming: number;
};

export type SchedulePageProps = {
    calendarDays: ScheduleDay[];
    filters: ScheduleFilters;
    items: PaginatedData<ScheduleItem>;
    stats: ScheduleStats;
};
