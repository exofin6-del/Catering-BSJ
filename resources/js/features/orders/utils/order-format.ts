import type {
    Order,
    OrderItem,
    OrderPaymentStatus,
    OrderPaymentType,
    OrderStatus,
    PriceValue,
} from '@/types';

export const orderStatusLabels: Record<OrderStatus, string> = {
    pending_confirmation: 'Menunggu ACC',
    confirmed: 'Terkonfirmasi',
    completed: 'Selesai',
    canceled: 'Dibatalkan',
};

export const orderPaymentStatusLabels: Record<OrderPaymentStatus, string> = {
    unpaid: 'Belum bayar',
    dp_paid: 'DP dibayar',
    paid: 'Lunas',
};

export const orderPaymentTypeLabels: Record<OrderPaymentType, string> = {
    dp: 'DP',
    full: 'Lunas',
};

export const orderStatusOptions = Object.entries(orderStatusLabels).map(
    ([value, label]) => ({
        label,
        value: value as OrderStatus,
    }),
);

export function formatOrderPrice(value: PriceValue): string {
    return new Intl.NumberFormat('id-ID', {
        currency: 'IDR',
        maximumFractionDigits: 0,
        style: 'currency',
    }).format(numberValue(value));
}

export function formatOrderItemPriceSummary(
    unitPrice: PriceValue,
    quantity: number,
): string {
    return `${formatOrderPrice(unitPrice)} × ${quantity}`;
}

export function numberValue(value: PriceValue): number {
    const amount = Number(value ?? 0);

    return Number.isFinite(amount) ? amount : 0;
}

export function formatOrderDate(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
    }).format(date);
}

export function formatOrderDateTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

export function formatOrderTime(value?: string | null): string {
    if (!value) {
        return '-';
    }

    return value.slice(0, 5);
}

export function orderReceiptDownloadFilename(
    order: Pick<Order, 'id' | 'order_code'>,
): string {
    const orderCode = order.order_code
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

    return `struk-${orderCode || order.id}.jpg`;
}

export function orderPaidAmount(order: Pick<Order, 'payments'>): number {
    return order.payments.reduce(
        (total, payment) => total + numberValue(payment.amount),
        0,
    );
}

export function orderRemainingAmount(
    order: Pick<Order, 'payments' | 'total_price'>,
): number {
    return Math.max(0, numberValue(order.total_price) - orderPaidAmount(order));
}

export function orderReceiptDate(
    order: Pick<Order, 'created_at' | 'payments' | 'updated_at'>,
): string | null | undefined {
    const latestPayment = order.payments[order.payments.length - 1] ?? null;

    return (
        latestPayment?.paid_at ??
        latestPayment?.created_at ??
        order.updated_at ??
        order.created_at
    );
}

export function orderPaymentTypeLabel(type: string): string {
    if (type === 'dp') {
        return 'DP';
    }

    if (type === 'remaining') {
        return 'Pelunasan';
    }

    if (type === 'full') {
        return 'Lunas';
    }

    return type;
}

export function orderPaymentMethodLabel(method: string): string {
    if (method === 'transfer') {
        return 'Transfer';
    }

    if (method === 'cash') {
        return 'Tunai';
    }

    if (method === 'manual') {
        return 'Manual';
    }

    return method;
}

export function orderStatusBadgeClass(status: OrderStatus): string {
    if (status === 'completed') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300';
    }

    if (status === 'canceled') {
        return 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300';
    }

    if (status === 'confirmed') {
        return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300';
    }

    return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300';
}

export function paymentStatusBadgeClass(status: OrderPaymentStatus): string {
    if (status === 'paid') {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300';
    }

    if (status === 'dp_paid') {
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300';
    }

    return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300';
}

export function orderItemDescription(item: OrderItem): string {
    if (item.item_type === 'menu_item') {
        return 'Menu';
    }

    const selectedNames = (item.selected_items ?? [])
        .map((selectedItem) => selectedItem.name)
        .filter(Boolean);

    if (selectedNames.length === 0) {
        return 'Paket';
    }

    return selectedNames.join(', ');
}
