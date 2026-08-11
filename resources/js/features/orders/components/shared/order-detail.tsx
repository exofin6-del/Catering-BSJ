import { zodResolver } from '@hookform/resolvers/zod';
import type { Errors } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
    FORM_ACTION_BUTTON_CLASS_NAME,
    FormActionFooter,
} from '@/components/shared/form-wizard';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
    removePersistentState,
    usePersistedFormState,
} from '@/lib/hooks/use-persistent-state';
import orderRoute from '@/routes/order';
import type { Order } from '@/types';

import { orderFormSchema } from '../../schema/order-form-schema';
import type { OrderFormData } from '../../types/order-types';
import { applyOrderFormServerErrors } from '../../utils/order-form-errors';
import {
    buildOrderPayload,
    initialOrderFormData,
    orderFormPaymentSummary,
} from '../../utils/order-form-values';
import {
    flushOrderIndexTableCache,
    orderIndexCacheTag,
} from '../../utils/order-index';
import { OrderCustomerSummaryView } from '../form/order-customer-summary';
import {
    orderSnapshotSummary,
    orderSnapshotSummaryItems,
} from '../form/order-form-summary-aside';
import { OrderPaymentStep } from '../form/steps/order-payment-step';

export function OrderDetail({ order }: { order: Order }) {
    const defaultValues = useMemo<OrderFormData>(
        () => initialOrderFormData(order),
        [order],
    );
    const [processing, setProcessing] = useState(false);
    const form = useForm<OrderFormData>({
        defaultValues,
        resolver: zodResolver(orderFormSchema),
    });
    const formStorageKey = `order-detail.v1.${order.id}`;
    usePersistedFormState(form, formStorageKey, ['proof_image']);

    function submit(values: OrderFormData): void {
        const payload = buildOrderPayload(values, order);
        let savingToastId: number | string | null = null;
        const dismissSavingToast = (): void => {
            if (savingToastId === null) {
                return;
            }

            toast.dismiss(savingToastId);
            savingToastId = null;
        };

        router.visit(
            orderRoute.update.url(order.id, {
                query: {
                    redirect: 'show',
                },
            }),
            {
                data: {
                    ...payload,
                    _method: 'put',
                },
                forceFormData: true,
                invalidateCacheTags: orderIndexCacheTag,
                method: 'post',
                onError: (errors: Errors) => {
                    applyOrderFormServerErrors(errors, form.setError);
                    toast.error('Gagal menyimpan perubahan detail order.', {
                        description: firstOrderErrorMessage(errors),
                        id: savingToastId ?? undefined,
                    });
                    savingToastId = null;
                },
                onFinish: () => {
                    dismissSavingToast();
                    setProcessing(false);
                },
                onHttpException: () => {
                    toast.error('Gagal menyimpan perubahan detail order.', {
                        id: savingToastId ?? undefined,
                    });
                    savingToastId = null;
                },
                onNetworkError: () => {
                    toast.error(
                        'Koneksi bermasalah. Perubahan belum tersimpan.',
                        {
                            id: savingToastId ?? undefined,
                        },
                    );
                    savingToastId = null;
                },
                onStart: () => {
                    flushOrderIndexTableCache();
                    router.flushByCacheTags(orderIndexCacheTag);
                    form.clearErrors();
                    setProcessing(true);
                    savingToastId = toast.loading(
                        'Menyimpan perubahan detail',
                        {
                            duration: Infinity,
                        },
                    );
                },
                onSuccess: () => {
                    dismissSavingToast();
                    removePersistentState(formStorageKey);
                },
                preserveScroll: true,
            },
        );
    }

    return (
        <Form {...form}>
            <form
                className="flex flex-1 flex-col gap-5"
                onSubmit={form.handleSubmit(submit)}
            >
                <OrderDetailPaymentStep order={order} />

                <FormActionFooter
                    center={
                        <span className="px-1 text-center text-[11px] font-medium whitespace-nowrap text-muted-foreground sm:text-xs">
                            {order.order_code}
                        </span>
                    }
                    mode="fixed"
                    trailing={
                        <Button
                            type="submit"
                            className={FORM_ACTION_BUTTON_CLASS_NAME}
                            disabled={processing || !form.formState.isDirty}
                        >
                            <Save className="size-4" />
                            {processing ? 'Menyimpan...' : 'Simpan perubahan'}
                        </Button>
                    }
                />
            </form>
        </Form>
    );
}

function OrderDetailPaymentStep({ order }: { order: Order }) {
    const { control } = useFormContext<OrderFormData>();
    const watchedValues = useWatch({ control });
    const paymentAmount = watchedValues.payment_amount ?? '';
    const paymentMethod = watchedValues.payment_method ?? '';
    const paymentType = watchedValues.payment_type ?? order.payment_type;
    const summary = useMemo(() => orderSnapshotSummary(order), [order]);
    const paymentSummary = useMemo(
        () =>
            orderFormPaymentSummary(
                summary.total,
                paymentAmount,
                paymentMethod,
                paymentType,
                order,
            ),
        [order, paymentAmount, paymentMethod, paymentType, summary.total],
    );

    return (
        <OrderPaymentStep
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
                    showLocationAction
                />
            }
            itemSummaries={orderSnapshotSummaryItems(order)}
            menuItems={[]}
            order={order}
            packages={[]}
            paymentSummary={paymentSummary}
            showPaymentForm={false}
            summary={summary}
            showCustomerInAside={false}
        />
    );
}

function firstOrderErrorMessage(errors: Errors): string | undefined {
    return Object.values(errors).find(
        (message): message is string =>
            typeof message === 'string' && message.trim() !== '',
    );
}
