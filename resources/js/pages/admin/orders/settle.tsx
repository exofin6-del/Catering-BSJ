import { Head, Link, router, useForm } from '@inertiajs/react';
import { ChevronLeft, CircleDollarSign } from 'lucide-react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';

import {
    FORM_ACTION_BUTTON_CLASS_NAME,
    FormActionFooter,
} from '@/components/shared/form-wizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field';
import { OrderCustomerSummaryView } from '@/features/orders/components/form/order-customer-summary';
import {
    OrderFormSummaryAside,
    orderSnapshotSummary,
    orderSnapshotSummaryItems,
} from '@/features/orders/components/form/order-form-summary-aside';
import {
    OrderPaymentAmountInput,
    OrderPaymentMetricGrid,
    OrderPaymentMethodSelect,
    OrderPaymentProofUpload,
} from '@/features/orders/components/form/steps/order-payment-step';
import type {
    OrderPaymentMetric,
    OrderPaymentMethodSelectValue,
} from '@/features/orders/components/form/steps/order-payment-step';
import type { OrderFormItem } from '@/features/orders/types/order-types';
import {
    formatOrderPrice,
    numberValue,
    orderPaidAmount,
    orderPaymentStatusLabels,
    orderRemainingAmount,
    orderStatusLabels,
    paymentStatusBadgeClass,
} from '@/features/orders/utils/order-format';
import {
    flushOrderIndexTableCache,
    orderIndexCacheTag,
} from '@/features/orders/utils/order-index';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';
import payments from '@/routes/order/payments';
import type { Order } from '@/types';

type SettleOrderFormData = {
    amount: string;
    method: 'cash' | 'transfer';
    notes: string;
    paid_at: string;
    proof_image: File | null;
    status: 'confirmed';
};

export default function OrderSettle({ order }: { order?: Order | null }) {
    if (!order) {
        return (
            <>
                <Head title="Pelunasan Order" />
                <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                    <div className="px-4 text-sm text-muted-foreground lg:px-6">
                        Order tidak ditemukan.
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={`Pelunasan ${order.order_code}`} />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-1 flex-col px-4 lg:px-6">
                    <SettlementForm order={order} />
                </div>
            </div>
        </>
    );
}

function SettlementForm({ order }: { order: Order }) {
    const total = numberValue(order.total_price);
    const previousPaid = orderPaidAmount(order);
    const remaining = orderRemainingAmount(order);
    const form = useForm<SettleOrderFormData>(`order-settle.v1.${order.id}`, {
        amount: String(Math.round(remaining)),
        method: 'transfer',
        notes: '',
        paid_at: todayDateValue(),
        proof_image: null,
        status: 'confirmed',
    }).dontRemember('proof_image');
    const canSubmit = order.status === 'confirmed' && remaining > 0;
    const paymentMetrics: OrderPaymentMetric[] = [
        {
            label: 'Total tagihan',
            value: formatOrderPrice(total),
        },
        {
            label: 'Sudah dibayar',
            value: formatOrderPrice(previousPaid),
        },
        {
            label: 'Pelunasan',
            value: formatOrderPrice(remaining),
        },
        {
            emphasized: true,
            label: 'Sisa setelah disimpan',
            value: formatOrderPrice(0),
        },
    ];

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        flushOrderIndexTableCache();
        router.flushByCacheTags(orderIndexCacheTag);

        form.post(payments.store.url(order.id), {
            forceFormData: true,
            invalidateCacheTags: orderIndexCacheTag,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pelunasan berhasil dicatat.');
            },
        });
    }

    return (
        <form className="flex flex-1 flex-col gap-5" onSubmit={submit}>
            <div className="grid w-full flex-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
                <section className="admin-card grid gap-5 p-4 md:p-5">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                            <h1 className="text-xl font-semibold">
                                Pelunasan {order.order_code}
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                Catat sisa tagihan yang sudah diterima untuk
                                menandai order sebagai lunas.
                            </p>
                        </div>

                        <Badge
                            variant="outline"
                            className={paymentStatusBadgeClass('paid')}
                        >
                            {orderPaymentStatusLabels.paid}
                        </Badge>
                    </div>

                    {!canSubmit ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                            Pelunasan tidak tersedia untuk order berstatus{' '}
                            {orderStatusLabels[order.status]} atau order yang
                            sudah lunas.
                        </div>
                    ) : null}

                    <OrderPaymentMetricGrid
                        hasNewPayment
                        metrics={paymentMetrics}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <OrderPaymentMethodSelect
                                id="settlement-payment-method"
                                invalid={Boolean(form.errors.method)}
                                value={form.data.method}
                                onChange={(
                                    value: OrderPaymentMethodSelectValue,
                                ) => {
                                    if (
                                        value === 'cash' ||
                                        value === 'transfer'
                                    ) {
                                        form.setData('method', value);
                                        form.clearErrors('method');
                                    }
                                }}
                            />
                            <FieldError
                                errors={[{ message: form.errors.method }]}
                            />
                        </div>

                        <div className="grid gap-2">
                            <OrderPaymentAmountInput
                                disabled
                                id="settlement-payment-amount"
                                invalid={Boolean(form.errors.amount)}
                                isPaidInFull
                                locked
                                placeholder="0"
                                value={form.data.amount}
                                onAmountChange={() => undefined}
                                onPaidInFullChange={() => undefined}
                            />
                            <FieldError
                                errors={[{ message: form.errors.amount }]}
                            />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <OrderPaymentProofUpload
                                disabled={!canSubmit}
                                invalid={Boolean(form.errors.proof_image)}
                                value={form.data.proof_image}
                                onRejectMessage={(message) => {
                                    form.setError('proof_image', message);
                                }}
                                onValueChange={(file) => {
                                    form.setData('proof_image', file);
                                    form.clearErrors('proof_image');
                                }}
                            />
                            <FieldError
                                errors={[{ message: form.errors.proof_image }]}
                            />
                        </div>
                    </div>

                    <FieldError errors={[{ message: form.errors.status }]} />
                </section>

                <OrderFormSummaryAside
                    className="admin-card p-4 md:p-5 lg:sticky lg:top-5 lg:self-start"
                    customerSummary={
                        <OrderCustomerSummaryView
                            values={{
                                address_name: order.address_name,
                                customer_name: order.customer_name,
                                event_address: order.event_address,
                                event_date: order.event_date,
                                event_name: order.event_name,
                                event_time: order.event_time,
                                latitude: order.latitude,
                                longitude: order.longitude,
                                notes: order.notes,
                                phone: order.phone,
                            }}
                        />
                    }
                    itemSummaries={orderSnapshotSummaryItems(order)}
                    items={orderFormItems(order)}
                    menuItems={[]}
                    packages={[]}
                    payments={order.payments}
                    summary={orderSnapshotSummary(order)}
                />
            </div>

            <FormActionFooter
                center={
                    <span className="px-1 text-center text-[11px] font-medium whitespace-nowrap text-muted-foreground sm:text-xs">
                        Pelunasan
                    </span>
                }
                leading={
                    <Button
                        type="button"
                        variant="outline"
                        className={FORM_ACTION_BUTTON_CLASS_NAME}
                        disabled={form.processing}
                        asChild
                    >
                        <Link href={orderRoute.show(order.id)}>
                            <ChevronLeft className="size-4" />
                            Kembali
                        </Link>
                    </Button>
                }
                mode="fixed"
                trailing={
                    <Button
                        type="submit"
                        className={FORM_ACTION_BUTTON_CLASS_NAME}
                        disabled={form.processing || !canSubmit}
                    >
                        <CircleDollarSign className="size-4" />
                        {form.processing ? 'Menyimpan...' : 'Catat pelunasan'}
                    </Button>
                }
            />
        </form>
    );
}

function todayDateValue(): string {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60_000;

    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function orderFormItems(order: Order): OrderFormItem[] {
    return order.items.map((item) => ({
        item_type: item.item_type,
        menu_item_id: item.menu_item_id ? String(item.menu_item_id) : '',
        package_id: item.package_id ? String(item.package_id) : '',
        qty: String(item.qty ?? 1),
        selected_items:
            item.selected_items?.map((selectedItem) => ({
                menu_item_id: selectedItem.menu_item_id
                    ? String(selectedItem.menu_item_id)
                    : '',
                package_item_id: selectedItem.package_item_id
                    ? String(selectedItem.package_item_id)
                    : '',
            })) ?? [],
    }));
}

OrderSettle.layout = ({ order }: { order?: Order | null }) => ({
    title: 'Pelunasan Order',
    description: order?.order_code ?? 'Catat pelunasan order.',
    back: {
        label: 'Kembali ke Detail',
        href: order?.id ? orderRoute.show(order.id) : orderRoute.index(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Order',
            href: orderRoute.index(),
        },
        {
            title: 'Detail',
            href: order?.id ? orderRoute.show(order.id) : orderRoute.index(),
        },
        {
            title: 'Pelunasan',
            href: order?.id ? payments.create(order.id) : orderRoute.index(),
        },
    ],
});
