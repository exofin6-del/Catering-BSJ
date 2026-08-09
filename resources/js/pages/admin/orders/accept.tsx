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
    orderStatusLabels,
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
import type { Order } from '@/types';

type AcceptOrderFormData = {
    payment_amount: string;
    payment_method: '' | 'cash' | 'transfer';
    payment_paid_at: string;
    proof_image: File | null;
    record_payment: boolean;
    status: 'confirmed';
};

export default function OrderAccept({ order }: { order?: Order | null }) {
    if (!order) {
        return (
            <>
                <Head title="ACC Order" />
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
            <Head title={`ACC ${order.order_code}`} />

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
        `order-accept.v1.${order.id}.paid-in-full`,
        false,
    );
    const form = useForm<AcceptOrderFormData>(`order-accept.v1.${order.id}`, {
        payment_amount: '',
        payment_method: '',
        payment_paid_at: todayDateValue(),
        proof_image: null,
        record_payment: false,
        status: 'confirmed',
    }).dontRemember('proof_image');
    const paymentAmount = form.data.record_payment
        ? Math.max(0, numberValue(form.data.payment_amount))
        : 0;
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
    const paymentMethodValue: OrderPaymentMethodSelectValue = form.data
        .record_payment
        ? form.data.payment_method
        : 'none';
    const isAmountLocked = remaining <= 0 || isPaidInFull || previousPaid > 0;
    const canSubmit =
        order.status === 'pending_confirmation' &&
        (!form.data.record_payment ||
            (paymentAmount > 0 &&
                paymentAmount <= remaining &&
                form.data.payment_method !== ''));
    const paymentDescription = hasNewPayment
        ? `${formatOrderPrice(paymentAmount)} akan dicatat saat order di-ACC. Sisa tagihan menjadi ${formatOrderPrice(projectedRemaining)}.`
        : 'Order akan di-ACC tanpa mencatat pembayaran baru.';
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
            label: hasNewPayment ? 'Sisa setelah ACC' : 'Sisa tagihan',
            value: formatOrderPrice(
                hasNewPayment ? projectedRemaining : remaining,
            ),
        },
    ];

    function setRecordPayment(recordPayment: boolean): void {
        form.setData('record_payment', recordPayment);

        if (!recordPayment) {
            form.setData('payment_amount', '');
            form.setData('payment_method', '');
            form.setData('proof_image', null);
            form.clearErrors('payment_amount', 'payment_method', 'proof_image');
            setIsPaidInFull(false);

            return;
        }

        if (form.data.payment_method === '') {
            form.setData('payment_method', 'transfer');
        }

        if (previousPaid > 0) {
            form.setData('payment_amount', String(Math.round(remaining)));
            setIsPaidInFull(true);
        }
    }

    function handlePaymentMethodChange(
        value: OrderPaymentMethodSelectValue,
    ): void {
        if (value === 'none') {
            setRecordPayment(false);

            return;
        }

        setRecordPayment(true);
        form.setData('payment_method', value);
        form.clearErrors('payment_method');
    }

    function handleAmountChange(value: string): void {
        if (isAmountLocked) {
            return;
        }

        const normalizedAmount = normalizeOrderPaymentAmountInput(
            value,
            remaining,
        );

        if (!form.data.record_payment && normalizedAmount !== '') {
            form.setData('record_payment', true);
            form.setData('payment_method', 'transfer');
            form.clearErrors('payment_method');
        }

        form.setData('payment_amount', normalizedAmount);
        form.clearErrors('payment_amount');
    }

    function handlePaidInFullChange(checked: boolean | 'indeterminate'): void {
        const shouldSettle = checked === true;

        setIsPaidInFull(shouldSettle);

        if (!shouldSettle) {
            if (previousPaid <= 0) {
                form.setData('payment_amount', '');
            }

            return;
        }

        setRecordPayment(true);

        if (form.data.payment_method === '') {
            form.setData('payment_method', 'transfer');
            form.clearErrors('payment_method');
        }

        form.setData('payment_amount', String(Math.round(remaining)));
        form.clearErrors('payment_amount');
    }

    function handleProofChange(file: File | null): void {
        form.setData('proof_image', file);
        form.clearErrors('proof_image');
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        flushOrderIndexTableCache();
        router.flushByCacheTags(orderIndexCacheTag);

        form.post(orderRoute.accept.url(order.id), {
            forceFormData: true,
            invalidateCacheTags: orderIndexCacheTag,
            preserveScroll: true,
            onSuccess: () => {
                window.sessionStorage.setItem('order-accepted', '1');
                window.dispatchEvent(new CustomEvent('order-accepted'));
                toast.success('Order berhasil di-ACC.');
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
                                {order.order_code}
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

                    {order.status !== 'pending_confirmation' ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                            Order ini sudah berstatus{' '}
                            {orderStatusLabels[order.status]}.
                        </div>
                    ) : null}

                    <OrderPaymentMetricGrid
                        hasNewPayment={hasNewPayment}
                        metrics={paymentMetrics}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <OrderPaymentMethodSelect
                                id="accept-payment-method"
                                includeUnpaid
                                invalid={Boolean(form.errors.payment_method)}
                                value={paymentMethodValue}
                                onChange={handlePaymentMethodChange}
                            />
                            <FieldError
                                errors={[
                                    { message: form.errors.payment_method },
                                ]}
                            />
                        </div>

                        <div className="grid gap-2">
                            <OrderPaymentAmountInput
                                disabled={remaining <= 0}
                                id="accept-payment-amount"
                                invalid={Boolean(form.errors.payment_amount)}
                                isPaidInFull={isPaidInFull}
                                locked={isAmountLocked}
                                placeholder="0"
                                value={form.data.payment_amount}
                                onAmountChange={handleAmountChange}
                                onPaidInFullChange={handlePaidInFullChange}
                            />
                            <FieldError
                                errors={[
                                    { message: form.errors.payment_amount },
                                ]}
                            />
                        </div>

                        <div className="grid gap-2 sm:col-span-2">
                            <OrderPaymentProofUpload
                                disabled={!form.data.record_payment}
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
                        Konfirmasi order
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
                        {form.processing ? 'Memproses...' : 'ACC order'}
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

OrderAccept.layout = ({ order }: { order?: Order | null }) => ({
    title: 'ACC Order',
    description: order?.order_code ?? 'Konfirmasi order.',
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
            title: 'ACC',
            href: order?.id
                ? orderRoute.acceptPage(order.id)
                : orderRoute.index(),
        },
    ],
});
