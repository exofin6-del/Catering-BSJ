import { zodResolver } from '@hookform/resolvers/zod';
import type { Errors } from '@inertiajs/core';
import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import {
    FormWizardFooter,
    FormWizardPage,
    FormWizardStepper,
} from '@/components/shared/form-wizard';
import { Form } from '@/components/ui/form';
import {
    removePersistentState,
    usePersistedFormState,
    usePersistentState,
} from '@/lib/hooks/use-persistent-state';
import orderRoute from '@/routes/order';

import { orderFormSchema } from '../../schema/order-form-schema';
import type {
    OrderFormData,
    OrderFormItem,
    OrderFormProps,
} from '../../types/order-types';
import {
    applyOrderFormServerErrors,
    resolveFirstOrderFormErrorStepIndex,
} from '../../utils/order-form-errors';
import {
    buildOrderPayload,
    initialOrderFormData,
    orderFormPaymentSummary,
    orderFormSummary,
} from '../../utils/order-form-values';
import {
    flushOrderIndexTableCache,
    orderIndexCacheTag,
} from '../../utils/order-index';
import {
    ORDER_FORM_ID,
    orderFormStepFields,
    orderFormSteps,
} from './constants';
import { OrderCustomerStep } from './steps/order-customer-step';
import { OrderItemsStep } from './steps/order-items-step';
import { OrderPaymentStep } from './steps/order-payment-step';

export function OrderForm({
    businessSetting,
    menuItems = [],
    order,
    packages = [],
    submitLabel,
}: OrderFormProps) {
    const isEditing = Boolean(order?.id);
    const formStorageKey = `order-form.v1.${isEditing ? `edit.${order?.id}` : 'create'}`;
    const [activeStepIndex, setActiveStepIndex] = usePersistentState(
        `${formStorageKey}.step`,
        0,
    );
    const [processing, setProcessing] = useState(false);
    const defaultValues = useMemo<OrderFormData>(
        () => initialOrderFormData(order),
        [order],
    );
    const form = useForm<OrderFormData>({
        defaultValues,
        resolver: zodResolver(orderFormSchema),
    });
    usePersistedFormState(form, formStorageKey, ['proof_image']);
    const {
        append: appendItem,
        fields: itemFields,
        remove: removeItem,
    } = useFieldArray({
        control: form.control,
        name: 'items',
    });
    const watchedValues = {
        ...defaultValues,
        ...useWatch({
            control: form.control,
        }),
    } as OrderFormData;
    const summary = useMemo(
        () => orderFormSummary(watchedValues.items, menuItems, packages),
        [watchedValues.items, menuItems, packages],
    );
    const paymentSummary = useMemo(
        () =>
            orderFormPaymentSummary(
                summary.total,
                watchedValues.payment_amount,
                watchedValues.payment_method,
                watchedValues.payment_type,
                order,
            ),
        [
            order,
            summary.total,
            watchedValues.payment_amount,
            watchedValues.payment_method,
            watchedValues.payment_type,
        ],
    );
    const currentStep = orderFormSteps[activeStepIndex];
    const isLastStep = activeStepIndex === orderFormSteps.length - 1;
    const itemError =
        typeof form.formState.errors.items?.message === 'string'
            ? form.formState.errors.items.message
            : null;

    function addItem(item: OrderFormItem) {
        appendItem(item);
    }

    async function handleNext() {
        const isValid = await form.trigger(
            orderFormStepFields[currentStep.id],
            {
                shouldFocus: true,
            },
        );

        if (isValid) {
            setActiveStepIndex((index) =>
                Math.min(index + 1, orderFormSteps.length - 1),
            );
        }
    }

    function handlePrevious() {
        setActiveStepIndex((index) => Math.max(index - 1, 0));
    }

    async function handleSave() {
        await form.handleSubmit(submit)();
    }

    async function handleStepClick(nextIndex: number) {
        if (nextIndex <= activeStepIndex) {
            setActiveStepIndex(nextIndex);

            return;
        }

        for (let index = activeStepIndex; index < nextIndex; index += 1) {
            const isValid = await form.trigger(
                orderFormStepFields[orderFormSteps[index].id],
                {
                    shouldFocus: true,
                },
            );

            if (!isValid) {
                return;
            }
        }

        setActiveStepIndex(nextIndex);
    }

    function submit(values: OrderFormData) {
        const payload = buildOrderPayload(values, order);
        const toastMessages = orderFormToastMessages(isEditing);
        let savingToastId: number | string | null = null;
        const showSavingErrorToast = (
            message: string,
            description?: string,
        ): void => {
            toast.error(message, {
                description,
                id: savingToastId ?? undefined,
            });
            savingToastId = null;
        };
        const dismissSavingToast = (): void => {
            if (savingToastId === null) {
                return;
            }

            toast.dismiss(savingToastId);
            savingToastId = null;
        };
        const routeOptions = {
            data: payload,
            invalidateCacheTags: orderIndexCacheTag,
            onError: (errors: Errors) => {
                applyOrderFormServerErrors(errors, form.setError);
                moveToFirstErrorStep(errors);
                showSavingErrorToast(
                    toastMessages.error,
                    firstOrderErrorMessage(errors),
                );
            },
            onFinish: () => {
                dismissSavingToast();
                setProcessing(false);
            },
            onHttpException: () => {
                showSavingErrorToast(toastMessages.error);
            },
            onNetworkError: () => {
                showSavingErrorToast(
                    'Koneksi bermasalah. Perubahan belum tersimpan.',
                );
            },
            onStart: () => {
                flushOrderIndexTableCache();
                router.flushByCacheTags(orderIndexCacheTag);
                form.clearErrors();
                setProcessing(true);
                savingToastId = toast.loading(toastMessages.loading, {
                    duration: Infinity,
                });
            },
            onSuccess: () => {
                dismissSavingToast();
                removePersistentState(formStorageKey);
                removePersistentState(`${formStorageKey}.step`);
            },
            preserveScroll: true,
        };

        if (isEditing && order?.id) {
            router.visit(orderRoute.update.url(order.id), {
                ...routeOptions,
                data: {
                    ...payload,
                    _method: 'put',
                },
                forceFormData: true,
                method: 'post',
            });

            return;
        }

        router.visit(orderRoute.store.url(), {
            ...routeOptions,
            forceFormData: true,
            method: 'post',
        });
    }

    function moveToFirstErrorStep(errors: Errors) {
        setActiveStepIndex(resolveFirstOrderFormErrorStepIndex(errors));
    }

    return (
        <Form {...form}>
            <form
                id={ORDER_FORM_ID}
                className="flex flex-1 flex-col gap-5"
                onSubmit={(event) => event.preventDefault()}
            >
                <FormWizardStepper
                    activeStepIndex={activeStepIndex}
                    steps={orderFormSteps}
                    onStepClick={handleStepClick}
                />

                <FormWizardPage>
                    {currentStep.id === 'customer' ? (
                        <OrderCustomerStep
                            businessSetting={businessSetting}
                            originalEventDate={order?.event_date ?? undefined}
                        />
                    ) : null}

                    {currentStep.id === 'items' ? (
                        <OrderItemsStep
                            data={watchedValues.items}
                            itemError={itemError}
                            itemKeys={itemFields.map((field) => field.id)}
                            menuItems={menuItems}
                            packages={packages}
                            onAddItem={addItem}
                            onRemoveItem={removeItem}
                        />
                    ) : null}

                    {currentStep.id === 'payment' ? (
                        <OrderPaymentStep
                            menuItems={menuItems}
                            order={order}
                            packages={packages}
                            paymentSummary={paymentSummary}
                            summary={summary}
                        />
                    ) : null}
                </FormWizardPage>

                <FormWizardFooter
                    mode="fixed"
                    activeStepIndex={activeStepIndex}
                    isLastStep={isLastStep}
                    processing={processing}
                    saveLabel={
                        submitLabel ??
                        (isEditing ? 'Simpan perubahan' : 'Simpan order')
                    }
                    savingLabel="Menyimpan..."
                    stepCount={orderFormSteps.length}
                    submitFormId={ORDER_FORM_ID}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onSaveClick={() => void handleSave()}
                />
            </form>
        </Form>
    );
}

function orderFormToastMessages(isEditing: boolean): {
    error: string;
    loading: string;
} {
    if (isEditing) {
        return {
            error: 'Gagal menyimpan perubahan. Periksa kembali data order.',
            loading: 'Menyimpan perubahan',
        };
    }

    return {
        error: 'Gagal menyimpan order. Periksa kembali data order.',
        loading: 'Menyimpan order',
    };
}

function firstOrderErrorMessage(errors: Errors): string | undefined {
    return Object.values(errors).find(
        (message): message is string =>
            typeof message === 'string' && message.trim() !== '',
    );
}
