import { Head, Link, router, useForm } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
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
    paymentStatusBadgeClass,
} from '@/features/orders/utils/order-format';
import {
    flushOrderIndexTableCache,
    orderIndexCacheTag,
} from '@/features/orders/utils/order-index';
import { normalizeOrderPaymentAmountInput } from '@/features/orders/utils/order-payment-logic';
import { usePersistentState } from '@/lib/hooks/use-persistent-state';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';
import payments from '@/routes/order/payments';
import type { Order } from '@/types';

type OrderPaymentFormData = {
    amount: string;
    method: '' | 'cash' | 'none' | 'transfer';
    notes: string;
    paid_at: string;
    proof_image: File | null;
};

export default function OrderPayment({ order }: { order?: Order | null }) {
    if (!order) {
        return (
            <>
                <Head title="PEMBAYARAN" />
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
            <Head title={`PEMBAYARAN ${order.order_code}`} />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-1 flex-col px-4 lg:px-6">
                    <AcceptPaymentForm order={order} />
                </div>
            </div>
        </>
    );
}

function AcceptPaymentForm({ order }: { order: Order }) {
    const total = numberValue(order.total_price);
    const previousPaid = orderPaidAmount(order);
    const remaining = orderRemainingAmount(order);
    const [isPaidInFull, setIsPaidInFull] = usePersistentState(
        `order-payment.v1.${order.id}.paid-in-full`,
        false,
    );
    const form = useForm<OrderPaymentFormData>(`order-payment.v1.${order.id}`, {
        amount: '',
        method: 'transfer',
        notes: '',
        paid_at: todayDateValue(),
        proof_image: null,
    }).dontRemember('proof_image');
    const paymentAmount = Math.max(0, numberValue(form.data.amount));
    const hasNewPayment = paymentAmount > 0;
    const projectedPaid = Math.min(total, previousPaid + paymentAmount);
    const projectedRemaining = Math.max(0, total - projectedPaid);
    const projectedStatus =
        projectedPaid <= 0
            ? 'unpaid'
            : projectedPaid >= total
              ? 'paid'
              : 'dp_paid';
    const paymentStatus = hasNewPayment
        ? projectedStatus
        : order.payment_status;
    const paymentMethodValue: OrderPaymentMethodSelectValue = form.data.method;
    const isAmountLocked = remaining <= 0 || isPaidInFull || previousPaid > 0;
    const canSubmit =
        remaining > 0 &&
        paymentAmount > 0 &&
        paymentAmount <= remaining &&
        form.data.method !== '' &&
        order.status !== 'canceled';
    const paymentDescription = hasNewPayment
        ? `${formatOrderPrice(paymentAmount)} akan dicatat pada order. Sisa tagihan menjadi ${formatOrderPrice(projectedRemaining)}.`
        : 'Masukkan nominal pembayaran untuk mencatat pembayaran ke order.';
    const paymentMetrics: OrderPaymentMetric[] = [
        {
            label: 'Total tagihan',
            value: formatOrderPrice(total),
        },
        {
            label: 'Sudah dibayar',
            value: formatOrderPrice(previousPaid),
        },
        ...(hasNewPayment
            ? [
                  {
                      label: 'Pembayaran baru',
                      value: formatOrderPrice(paymentAmount),
                  },
              ]
            : []),
        {
            emphasized: true,
            label: hasNewPayment ? 'Sisa setelah pembayaran' : 'Sisa tagihan',
            value: formatOrderPrice(
                hasNewPayment ? projectedRemaining : remaining,
            ),
        },
    ];

    function handlePaymentMethodChange(
        value: OrderPaymentMethodSelectValue,
    ): void {
        form.setData('method', value);
        form.clearErrors('method');
    }

    function handleAmountChange(value: string): void {
        if (isAmountLocked) {
            return;
        }

        const normalizedAmount = normalizeOrderPaymentAmountInput(
            value,
            remaining,
        );

        if (normalizedAmount !== '' && form.data.method === '') {
            form.setData('method', 'transfer');
            form.clearErrors('method');
        }

        form.setData('amount', normalizedAmount);
        form.clearErrors('amount');
    }

    function handlePaidInFullChange(checked: boolean | 'indeterminate'): void {
        const shouldSettle = checked === true;

        setIsPaidInFull(shouldSettle);

        if (!shouldSettle) {
            if (previousPaid <= 0) {
                form.setData('amount', '');
            }

            return;
        }

        if (form.data.method === '') {
            form.setData('method', 'transfer');
            form.clearErrors('method');
        }

        form.setData('amount', String(Math.round(remaining)));
        form.clearErrors('amount');
    }

    function handleProofChange(file: File | null): void {
        form.setData('proof_image', file);
        form.clearErrors('proof_image');
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        flushOrderIndexTableCache();
        router.flushByCacheTags(orderIndexCacheTag);

        form.post(payments.store.url(order.id), {
            forceFormData: true,
            invalidateCacheTags: orderIndexCacheTag,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pembayaran berhasil dicatat.');
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
                                PEMBAYARAN {order.order_code}
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                                {paymentDescription}
                            </p>
                        </div>

                        <Badge
                            variant="outline"
                            className={paymentStatusBadgeClass(paymentStatus)}
                        >
                            {orderPaymentStatusLabels[paymentStatus]}
                        </Badge>
                    </div>

                    <OrderPaymentMetricGrid
                        hasNewPayment={hasNewPayment}
                        metrics={paymentMetrics}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <OrderPaymentMethodSelect
                                id="payment-method"
                                invalid={Boolean(form.errors.method)}
                                value={paymentMethodValue}
                                onChange={handlePaymentMethodChange}
                            />
                            <FieldError
                                errors={[{ message: form.errors.method }]}
                            />
                        </div>

                        <div className="grid gap-2">
                            <OrderPaymentAmountInput
                                disabled={remaining <= 0}
                                id="payment-amount"
                                invalid={Boolean(form.errors.amount)}
                                isPaidInFull={isPaidInFull}
                                locked={isAmountLocked}
                                placeholder="0"
                                value={form.data.amount}
                                onAmountChange={handleAmountChange}
                                onPaidInFullChange={handlePaidInFullChange}
                            />
                            <FieldError
                                errors={[{ message: form.errors.amount }]}
                            />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <OrderPaymentProofUpload
                                disabled={paymentAmount <= 0}
                                invalid={Boolean(form.errors.proof_image)}
                                value={form.data.proof_image}
                                onRejectMessage={(message) => {
                                    form.setError('proof_image', message);
                                }}
                                onValueChange={handleProofChange}
                            />
                            <FieldError
                                errors={[{ message: form.errors.proof_image }]}
                            />
                        </div>
                    </div>
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
                        Pembayaran
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
                        <Link href={orderRoute.index()}>
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
                        <CheckCircle2 className="size-4" />
                        {form.processing ? 'Memproses...' : 'Catat pembayaran'}
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

OrderPayment.layout = ({ order }: { order?: Order | null }) => ({
    title: 'PEMBAYARAN',
    description: order?.order_code ?? 'Catat pembayaran order.',
    back: {
        label: 'Kembali ke Order',
        href: orderRoute.index(),
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
            title: 'PEMBAYARAN',
            href: order?.id ? orderRoute.payPage(order.id) : orderRoute.index(),
        },
    ],
});
