import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    CreditCard,
    MapPin,
    MessageSquare,
    PackageCheck,
    Receipt,
    ShoppingBag,
    Utensils,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
} from '@/components/ui/card';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';
import {
    formatOrderDate,
    formatOrderPrice,
    formatOrderTime,
    orderPaymentStatusLabels,
    orderStatusBadgeClass,
    orderStatusLabels,
    paymentStatusBadgeClass,
} from '@/features/orders/utils/order-format';
import CustomerDetailLayout from '@/layouts/customer/customer-detail-layout';
import { menuCatalog } from '@/routes/customerV2';
import type { OrderPaymentStatus, OrderStatus } from '@/types';

export type CustomerOrderItem = {
    id: string;
    item_type: 'menu_item' | 'package';
    name_snapshot: string;
    qty: number;
    subtotal: number;
};

export type CustomerOrder = {
    id: string;
    order_code: string;
    customer_name: string;
    event_name: string | null;
    event_date: string | null;
    event_time: string | null;
    event_address: string | null;
    status: OrderStatus;
    payment_status: OrderPaymentStatus;
    payment_type: 'dp' | 'full';
    total_price: number;
    dp_amount: number;
    remaining_amount: number;
    notes: string | null;
    created_at: string | null;
    items: CustomerOrderItem[];
};

type CustomerOrdersPageProps = CustomerStorefrontProps & {
    orders: CustomerOrder[];
};

export default function CustomerOrdersPage({
    business,
    orders,
}: CustomerOrdersPageProps) {
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const filteredOrders = orders.filter((order) => {
        if (selectedStatus === 'all') {
return true;
}

        return order.status === selectedStatus;
    });

    const buildWhatsAppLink = (order: CustomerOrder) => {
        if (!business.whatsapp_number) {
return '#';
}

        const message = `Halo ${business.name}, saya ingin menanyakan status pesanan saya dengan kode: *${order.order_code}*. Terima kasih!`;

        return `https://wa.me/${business.whatsapp_number}?text=${encodeURIComponent(message)}`;
    };

    return (
        <>
            <Head title="Pesanan Saya" />

            <div className="flex min-h-[calc(100vh-8rem)] w-full flex-col text-foreground">
                <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-4 sm:py-6">
                    {/* Filter Tabs */}
                    {orders.length > 0 && (
                        <div className="mb-6 flex overflow-x-auto border-b border-border/60 pb-2 scrollbar-none gap-2">
                            {[
                                { id: 'all', label: 'Semua Pesanan' },
                                { id: 'pending_confirmation', label: 'Menunggu ACC' },
                                { id: 'confirmed', label: 'Terkonfirmasi' },
                                { id: 'completed', label: 'Selesai' },
                                { id: 'canceled', label: 'Dibatalkan' },
                            ].map((tab) => {
                                const count =
                                    tab.id === 'all'
                                        ? orders.length
                                        : orders.filter(
                                              (o) => o.status === tab.id,
                                          ).length;

                                if (count === 0 && tab.id !== 'all') {
                                    return null;
                                }

                                const isActive = selectedStatus === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSelectedStatus(tab.id)}
                                        type="button"
                                        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-xs'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                                                isActive
                                                    ? 'bg-primary-foreground/20 text-primary-foreground'
                                                    : 'bg-background text-muted-foreground'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Orders List */}
                    {filteredOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrders.map((order) => (
                                <Card
                                    key={order.id}
                                    className="overflow-hidden border-border/60 bg-card shadow-xs transition-all hover:shadow-md"
                                >
                                    <CardHeader className="border-b border-border/40 bg-muted/30 p-4 sm:p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="size-4 text-primary" />
                                                <span className="font-mono text-sm font-bold text-foreground">
                                                    #{order.order_code}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    • {formatOrderDate(order.created_at)}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={orderStatusBadgeClass(
                                                        order.status,
                                                    )}
                                                >
                                                    {orderStatusLabels[order.status] ||
                                                        order.status}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className={paymentStatusBadgeClass(
                                                        order.payment_status,
                                                    )}
                                                >
                                                    {orderPaymentStatusLabels[
                                                        order.payment_status
                                                    ] || order.payment_status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-4 sm:p-5 space-y-4">
                                        {/* Event Info Header */}
                                        {(order.event_name ||
                                            order.event_date ||
                                            order.event_address) && (
                                            <div className="rounded-lg bg-muted/20 p-3 text-xs sm:text-sm space-y-1.5 border border-border/30">
                                                {order.event_name && (
                                                    <div className="font-semibold text-foreground">
                                                        {order.event_name}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
                                                    {order.event_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="size-3.5 text-primary shrink-0" />
                                                            <span>
                                                                {formatOrderDate(
                                                                    order.event_date,
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {order.event_time && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="size-3.5 text-primary shrink-0" />
                                                            <span>
                                                                {formatOrderTime(
                                                                    order.event_time,
                                                                )}{' '}
                                                                WIB
                                                            </span>
                                                        </div>
                                                    )}
                                                    {order.event_address && (
                                                        <div className="flex items-center gap-1 w-full sm:w-auto">
                                                            <MapPin className="size-3.5 text-primary shrink-0" />
                                                            <span className="line-clamp-1">
                                                                {order.event_address}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Items List */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                <Utensils className="size-3.5 text-primary" />
                                                <span>Rincian Menu</span>
                                            </div>
                                            <div className="divide-y divide-border/40 rounded-lg border border-border/40 px-3 py-1">
                                                {order.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between py-2 text-sm"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="secondary"
                                                                className="text-[10px] px-1.5 py-0"
                                                            >
                                                                {item.item_type ===
                                                                'package'
                                                                    ? 'Paket'
                                                                    : 'Menu'}
                                                            </Badge>
                                                            <span className="font-medium text-foreground">
                                                                {item.name_snapshot}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                x{item.qty}
                                                            </span>
                                                        </div>
                                                        <span className="font-semibold text-foreground">
                                                            {formatOrderPrice(
                                                                item.subtotal,
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Notes if present */}
                                        {order.notes && (
                                            <div className="text-xs text-muted-foreground bg-muted/10 p-2.5 rounded border border-dashed border-border/60">
                                                <span className="font-medium text-foreground">
                                                    Catatan:{' '}
                                                </span>
                                                {order.notes}
                                            </div>
                                        )}

                                        {/* Total & Action Footer */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
                                            <div className="flex items-center justify-between sm:justify-start gap-4">
                                                <div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <CreditCard className="size-3" />
                                                        <span>Total Pembayaran</span>
                                                    </div>
                                                    <div className="text-base font-bold text-primary">
                                                        {formatOrderPrice(
                                                            order.total_price,
                                                        )}
                                                    </div>
                                                </div>

                                                {order.payment_type === 'dp' &&
                                                    order.remaining_amount > 0 && (
                                                        <div className="border-l border-border/60 pl-4">
                                                            <div className="text-[11px] text-amber-600 font-medium">
                                                                Sisa Pelunasan
                                                            </div>
                                                            <div className="text-xs font-semibold text-foreground">
                                                                {formatOrderPrice(
                                                                    order.remaining_amount,
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                            </div>

                                            {business.whatsapp_number && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                                >
                                                    <a
                                                        href={buildWhatsAppLink(
                                                            order,
                                                        )}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <MessageSquare className="size-4" />
                                                        <span>Tanya via WA</span>
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center py-8">
                            <Empty className="w-full max-w-md border bg-background/50 py-12">
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <ShoppingBag />
                                    </EmptyMedia>
                                    <EmptyTitle>Belum ada pesanan</EmptyTitle>
                                    <EmptyDescription>
                                        {selectedStatus === 'all'
                                            ? 'Anda belum memiliki riwayat pesanan catering.'
                                            : 'Tidak ada pesanan dengan status ini.'}
                                    </EmptyDescription>
                                </EmptyHeader>
                                <EmptyContent>
                                    <Button asChild>
                                        <Link href={menuCatalog()}>
                                            <PackageCheck className="size-4" />
                                            Buat Pesanan
                                        </Link>
                                    </Button>
                                </EmptyContent>
                            </Empty>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

CustomerOrdersPage.layout = (page: React.ReactNode) => (
    <CustomerDetailLayout
        title="Pesanan Saya"
        backHref="/"
        backLabel="Kembali ke Beranda"
        showFooter={false}
    >
        {page}
    </CustomerDetailLayout>
);

