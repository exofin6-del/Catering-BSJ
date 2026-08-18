export type DashboardStats = {
    active_menu_items: number;
    active_packages: number;
    completed_this_month: number;
    need_payment: number;
    outstanding_balance: string;
    pending_confirmation: number;
    revenue_this_month: string;
    today_orders: number;
    total_orders: number;
    upcoming_orders: number;
};

export type DashboardOrderTraffic = {
    date: string;
    orders: number;
    revenue: string;
};

export type DashboardStatusSummary = {
    label: string;
    tone: string;
    value: number;
};

export type DashboardDailyLoad = {
    capacity: number;
    end_time: string;
    id: number;
    name: string;
    order_count: number;
    start_time: string;
};

export type DashboardUpcomingOrder = {
    customer_name: string;
    event_date: string | null;
    event_name: string;
    event_time: string;
    id: number;
    order_code: string;
    payment_status: string;
    phone: string;
    remaining_amount: string;
    status: string;
    total_price: string;
};

export type DashboardPageProps = {
    dailyLoads: DashboardDailyLoad[];
    orderTraffic: DashboardOrderTraffic[];
    stats: DashboardStats;
    statusSummary: DashboardStatusSummary[];
    upcomingOrders: DashboardUpcomingOrder[];
};

export const emptyDashboardStats: DashboardStats = {
    active_menu_items: 0,
    active_packages: 0,
    completed_this_month: 0,
    need_payment: 0,
    outstanding_balance: '0.00',
    pending_confirmation: 0,
    revenue_this_month: '0.00',
    today_orders: 0,
    total_orders: 0,
    upcoming_orders: 0,
};
