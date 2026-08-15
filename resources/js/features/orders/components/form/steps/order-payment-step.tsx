import { ImagePlus, X } from 'lucide-react';
import { useEffect } from 'react';
import type { FocusEventHandler, ReactNode, Ref } from 'react';
import type {
    Control,
    FieldPath,
    FieldPathValue,
    UseFormSetValue,
} from 'react-hook-form';
import { useFormContext, useWatch } from 'react-hook-form';

import type { OrderSummaryItemData } from '@/components/shared/order-summaries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLegend,
    FieldSet,
} from '@/components/ui/field';
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
} from '@/components/ui/file-upload';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Order, OrderMenuItem, OrderPackage } from '@/types';

import type { OrderFormData } from '../../../types/order-types';
import type {
    OrderFormPaymentSummary,
    OrderFormSummary,
} from '../../../utils/order-form-values';
import {
    formatOrderPrice,
    numberValue,
    orderPaymentStatusLabels,
    orderStatusBadgeClass,
    orderStatusLabels,
    paymentStatusBadgeClass,
} from '../../../utils/order-format';
import {
    inferredOrderPaymentType,
    normalizeOrderPaymentAmountInput,
    orderPaymentAmountFormValue,
} from '../../../utils/order-payment-logic';
import { OrderFormSummaryAside } from '../order-form-summary-aside';

export type OrderPaymentMetric = {
    emphasized?: boolean;
    label: string;
    value: string;
};

export type OrderPaymentMethodSelectValue = '' | 'cash' | 'none' | 'transfer';

export function OrderPaymentStep({
    customerSummary,
    itemSummaries,
    menuItems,
    order,
    packages,
    paymentSummary,
    showPaymentForm = true,
    summary,
    showCustomerInAside = true,
}: {
    customerSummary?: ReactNode;
    itemSummaries?: OrderSummaryItemData[];
    menuItems: OrderMenuItem[];
    order?: Order | null;
    packages: OrderPackage[];
    paymentSummary: OrderFormPaymentSummary;
    showPaymentForm?: boolean;
    summary: OrderFormSummary;
    showCustomerInAside?: boolean;
}) {
    const { control } = useFormContext<OrderFormData>();
    const items = useWatch({ control, defaultValue: [], name: 'items' });
    const hasNewPayment = paymentSummary.currentPayment > 0;
    const status = hasNewPayment
        ? paymentSummary.projectedStatus
        : paymentSummary.currentStatus;

    return (
        <div className="grid items-start gap-5 lg:grid-cols-[3fr_1.5fr]">
            <div className="grid min-w-0 gap-5">
                {!showCustomerInAside && customerSummary && (
                    <section className="admin-card p-4 md:p-5">
                        <FieldSet className="gap-4">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <FieldContent>
                                    <FieldLegend className="text-md font-semibold text-foreground">
                                        Informasi Order
                                    </FieldLegend>
                                    <FieldDescription className="text-sm leading-snug">
                                        Rincian kontak pelanggan, waktu, dan
                                        lokasi pengiriman.
                                    </FieldDescription>
                                </FieldContent>
                                {order && (
                                    <div className="grid shrink-0 justify-items-start gap-1 sm:justify-items-end">
                                        <span className="text-xs text-muted-foreground">
                                            Status Order
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className={orderStatusBadgeClass(
                                                order.status,
                                            )}
                                        >
                                            {orderStatusLabels[order.status]}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-border/60 pt-4">
                                {customerSummary}
                            </div>
                        </FieldSet>
                    </section>
                )}

                <section className="admin-card min-w-0 p-4 md:p-5">
                    <FieldSet className="gap-5">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                            <FieldContent>
                                <FieldLegend className="text-md font-semibold text-foreground">
                                    Informasi Pembayaran
                                </FieldLegend>
                                <FieldDescription className="text-sm leading-snug">
                                    {!showPaymentForm
                                        ? 'Tinjau status dan riwayat pembayaran order.'
                                        : order
                                          ? 'Catat pembayaran baru hanya saat uangnya sudah diterima.'
                                          : 'Isi pembayaran awal jika uangnya sudah diterima.'}
                                </FieldDescription>
                            </FieldContent>

                            <div className="grid shrink-0 justify-items-start gap-1 sm:justify-items-end">
                                <span className="text-xs text-muted-foreground">
                                    Status Pembayaran
                                </span>
                                <Badge
                                    variant="outline"
                                    className={paymentStatusBadgeClass(status)}
                                >
                                    {orderPaymentStatusLabels[status]}
                                </Badge>
                            </div>
                        </div>

                        <PaymentFields
                            order={order}
                            paymentSummary={paymentSummary}
                            showPaymentForm={showPaymentForm}
                        />
                    </FieldSet>
                </section>
            </div>

            <OrderFormSummaryAside
                className="admin-card p-4 md:p-5"
                customerSummary={customerSummary}
                itemSummaries={itemSummaries}
                items={items}
                menuItems={menuItems}
                packages={packages}
                payments={order?.payments ?? []}
                summary={summary}
                showCustomerTab={showCustomerInAside}
            />
        </div>
    );
}

function PaymentFields({
    order,
    paymentSummary,
    showPaymentForm,
}: {
    order?: Order | null;
    paymentSummary: OrderFormPaymentSummary;
    showPaymentForm: boolean;
}) {
    const { clearErrors, control, setError, setValue } =
        useFormContext<OrderFormData>();
    const paymentAmount = useWatch({
        control,
        defaultValue: '',
        name: 'payment_amount',
    });
    const isPaidInFull = useWatch({
        control,
        defaultValue: false,
        name: 'is_paid_in_full',
    });
    const paymentMethod = useWatch({
        control,
        defaultValue: '',
        name: 'payment_method',
    });
    const isRecordingPayment = paymentMethod !== '';
    const hasExistingPayment = paymentSummary.previousPaid > 0;
    const shouldUseRemainingAmount = isPaidInFull || hasExistingPayment;
    const isSettlingRemaining = isRecordingPayment && shouldUseRemainingAmount;
    const remainingAmount = orderPaymentAmountFormValue(
        paymentSummary.remainingBeforePayment,
    );
    const isAmountLocked = shouldUseRemainingAmount;
    const hasNewPayment = paymentSummary.currentPayment > 0;

    const metrics: OrderPaymentMetric[] = [
        {
            label: 'Total tagihan',
            value: formatOrderPrice(paymentSummary.total),
        },
        {
            label: 'Sudah dibayar',
            value: formatOrderPrice(paymentSummary.previousPaid),
        },
        ...(hasNewPayment
            ? [
                  {
                      label: 'Pembayaran baru',
                      value: formatOrderPrice(paymentSummary.currentPayment),
                  },
              ]
            : []),
        {
            emphasized: true,
            label: hasNewPayment ? 'Sisa setelah disimpan' : 'Sisa tagihan',
            value: formatOrderPrice(
                hasNewPayment
                    ? paymentSummary.remaining
                    : paymentSummary.remainingBeforePayment,
            ),
        },
    ];

    useEffect(() => {
        if (!paymentSummary.canRecordPayment) {
            return;
        }

        if (!isRecordingPayment) {
            syncField(setValue, 'payment_amount', '');
            syncField(setValue, 'is_paid_in_full', false);
            syncField(
                setValue,
                'payment_type',
                inferredPaymentType('', order, paymentSummary),
            );

            return;
        }

        if (shouldUseRemainingAmount) {
            syncField(setValue, 'payment_amount', remainingAmount);
            syncField(
                setValue,
                'payment_type',
                inferredPaymentType(remainingAmount, order, paymentSummary),
            );

            return;
        }

        const normalizedAmount = normalizeOrderPaymentAmountInput(
            paymentAmount,
            paymentSummary.remainingBeforePayment,
        );

        syncField(setValue, 'payment_amount', normalizedAmount);
        syncField(
            setValue,
            'payment_type',
            inferredPaymentType(normalizedAmount, order, paymentSummary),
        );
    }, [
        paymentAmount,
        isRecordingPayment,
        order,
        paymentSummary,
        paymentSummary.canRecordPayment,
        paymentSummary.remainingBeforePayment,
        paymentSummary.previousPaid,
        remainingAmount,
        shouldUseRemainingAmount,
        setValue,
    ]);

    function updatePaymentField<TField extends FieldPath<OrderFormData>>(
        field: TField,
        value: FieldPathValue<OrderFormData, TField>,
    ): void {
        setFormValue(setValue, field, value);
    }

    function handleMethodChange(
        nextMethod: OrderFormData['payment_method'],
    ): void {
        updatePaymentField('payment_method', nextMethod);
        clearErrors('payment_method');

        if (nextMethod === '') {
            updatePaymentField('is_paid_in_full', false);
            updatePaymentField('payment_amount', '');
            updatePaymentField(
                'payment_type',
                inferredPaymentType('', order, paymentSummary),
            );
            updatePaymentField('proof_image', null);
            clearErrors('payment_amount');
            clearErrors('payment_type');
            clearErrors('proof_image');

            return;
        }

        if (shouldUseRemainingAmount) {
            updatePaymentField('payment_amount', remainingAmount);
            updatePaymentField(
                'payment_type',
                inferredPaymentType(remainingAmount, order, paymentSummary),
            );

            return;
        }
    }

    function handlePaidInFullChange(checked: boolean | 'indeterminate'): void {
        const shouldSettle = checked === true;

        updatePaymentField('is_paid_in_full', shouldSettle);

        if (!shouldSettle) {
            if (!hasExistingPayment) {
                updatePaymentField('payment_amount', '');
                updatePaymentField(
                    'payment_type',
                    inferredPaymentType('', order, paymentSummary),
                );
            }

            return;
        }

        if (!isRecordingPayment) {
            updatePaymentField('payment_method', 'transfer');
            clearErrors('payment_method');
        }

        updatePaymentField('payment_amount', remainingAmount);
        updatePaymentField(
            'payment_type',
            inferredPaymentType(remainingAmount, order, paymentSummary),
        );
    }

    function handleAmountChange(value: string): void {
        if (isAmountLocked) {
            return;
        }

        const normalizedAmount = normalizeOrderPaymentAmountInput(
            value,
            paymentSummary.remainingBeforePayment,
        );

        if (!isRecordingPayment && normalizedAmount !== '') {
            updatePaymentField('payment_method', 'transfer');
            clearErrors('payment_method');
        }

        updatePaymentField('payment_amount', normalizedAmount);
        updatePaymentField(
            'payment_type',
            inferredPaymentType(normalizedAmount, order, paymentSummary),
        );
    }

    return (
        <FieldGroup className="gap-5">
            <OrderPaymentMetricGrid
                hasNewPayment={hasNewPayment}
                metrics={metrics}
            />

            {showPaymentForm && paymentSummary.canRecordPayment ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    <PaymentMethodField
                        control={control}
                        onChange={handleMethodChange}
                    />

                    <PaymentAmountField
                        control={control}
                        disabled={hasExistingPayment}
                        isPaidInFull={isSettlingRemaining}
                        locked={isAmountLocked}
                        placeholder="0"
                        onAmountChange={handleAmountChange}
                        onPaidInFullChange={handlePaidInFullChange}
                    />

                    <PaymentProofField
                        control={control}
                        disabled={!isRecordingPayment}
                        onClearErrors={clearErrors}
                        onSetError={setError}
                    />
                </div>
            ) : null}
        </FieldGroup>
    );
}

export function OrderPaymentMetricGrid({
    hasNewPayment,
    metrics,
}: {
    hasNewPayment: boolean;
    metrics: OrderPaymentMetric[];
}) {
    const metricColumns = hasNewPayment
        ? 'grid gap-3 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-2 xl:grid-cols-4'
        : 'grid gap-3 rounded-md border border-border/60 bg-muted/10 p-3 sm:grid-cols-3';

    return (
        <div className={metricColumns}>
            {metrics.map(({ emphasized = false, label, value }) => (
                <div
                    key={label}
                    className="min-w-0 rounded-sm bg-background/60 px-3 py-2"
                >
                    <p className="text-xs font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p
                        className={
                            emphasized
                                ? 'mt-1 truncate text-base font-bold text-foreground tabular-nums'
                                : 'mt-1 truncate text-sm font-semibold text-foreground tabular-nums'
                        }
                    >
                        {value}
                    </p>
                </div>
            ))}
        </div>
    );
}

export function OrderPaymentMethodSelect({
    id,
    includeUnpaid = false,
    invalid = false,
    value,
    onChange,
}: {
    id?: string;
    includeUnpaid?: boolean;
    invalid?: boolean;
    value: OrderPaymentMethodSelectValue;
    onChange: (value: OrderPaymentMethodSelectValue) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>Metode pembayaran</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger
                    id={id}
                    className="w-full"
                    aria-invalid={invalid}
                >
                    <SelectValue placeholder="Belum dibayar" />
                </SelectTrigger>
                <SelectContent>
                    {includeUnpaid ? (
                        <SelectItem value="none">Belum dibayar</SelectItem>
                    ) : null}
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="cash">Tunai</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

export function OrderPaymentAmountInput({
    disabled,
    id,
    inputName,
    inputRef,
    invalid = false,
    isPaidInFull,
    locked,
    onAmountChange,
    onBlur,
    onPaidInFullChange,
    placeholder,
    value,
}: {
    disabled: boolean;
    id?: string;
    inputName?: string;
    inputRef?: Ref<HTMLInputElement>;
    invalid?: boolean;
    isPaidInFull: boolean;
    locked: boolean;
    onAmountChange: (value: string) => void;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    onPaidInFullChange: (checked: boolean | 'indeterminate') => void;
    placeholder: string;
    value: string;
}) {
    return (
        <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
                <Label htmlFor={id}>Nominal pembayaran</Label>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground data-disabled:cursor-not-allowed data-disabled:opacity-50">
                    <Checkbox
                        checked={isPaidInFull}
                        disabled={disabled}
                        className="size-4 rounded"
                        onCheckedChange={onPaidInFullChange}
                    />
                    Catat lunas
                </label>
            </div>
            <InputGroup
                data-disabled={locked ? true : undefined}
                className={locked ? 'cursor-not-allowed bg-muted/40' : ''}
            >
                <InputGroupAddon
                    className={locked ? 'cursor-not-allowed' : undefined}
                >
                    <InputGroupText>Rp</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                    id={id}
                    name={inputName}
                    ref={inputRef}
                    aria-invalid={invalid}
                    value={formatPaymentAmountInput(value)}
                    readOnly={locked}
                    inputMode="numeric"
                    placeholder={placeholder}
                    className="read-only:cursor-not-allowed read-only:text-muted-foreground read-only:opacity-80"
                    onBlur={onBlur}
                    onChange={(event) => {
                        onAmountChange(event.target.value);
                    }}
                />
            </InputGroup>
        </div>
    );
}

export function OrderPaymentProofUpload({
    disabled,
    invalid = false,
    onRejectMessage,
    onValueChange,
    value,
}: {
    disabled: boolean;
    invalid?: boolean;
    onRejectMessage: (message: string) => void;
    onValueChange: (file: File | null) => Promise<void> | void;
    value: File | null;
}) {
    function handleValueChange(files: File[]): void {
        const file = files[0] ?? null;

        onValueChange(file);
    }

    return (
        <div className="grid gap-2">
            <Label>Bukti pembayaran</Label>
            <FileUpload
                value={value ? [value] : []}
                accept="image/*"
                disabled={disabled}
                invalid={invalid}
                label="Bukti pembayaran"
                maxFiles={1}
                onFileReject={(_file, message) => {
                    onRejectMessage(
                        message.startsWith('Maximum')
                            ? 'Maksimal satu gambar.'
                            : message,
                    );
                }}
                onFileValidate={(file) => {
                    if (!file.type.startsWith('image/')) {
                        return 'File harus berupa gambar.';
                    }

                    return null;
                }}
                onValueChange={(files) => {
                    void handleValueChange(files);
                }}
            >
                {value ? (
                    <FileUploadList forceMount>
                        <FileUploadItem
                            value={value}
                            className="border-border/60 bg-muted/15"
                        >
                            <FileUploadItemPreview className="size-14" />
                            <FileUploadItemMetadata />
                            <FileUploadItemDelete asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    aria-label="Hapus bukti pembayaran"
                                >
                                    <X className="size-4" />
                                </Button>
                            </FileUploadItemDelete>
                        </FileUploadItem>
                    </FileUploadList>
                ) : (
                    <FileUploadDropzone className="min-h-32 bg-muted/15 px-4 py-5">
                        <ImagePlus className="size-7 text-muted-foreground" />
                        <div className="grid gap-1 text-center">
                            <p className="text-sm font-medium">
                                Upload bukti pembayaran
                            </p>
                            <p className="text-xs text-muted-foreground">
                                File besar akan dikompres otomatis.
                            </p>
                        </div>
                    </FileUploadDropzone>
                )}
            </FileUpload>
        </div>
    );
}

function PaymentMethodField({
    control,
    onChange,
}: {
    control: Control<OrderFormData>;
    onChange: (method: OrderFormData['payment_method']) => void;
}) {
    return (
        <FormField
            control={control}
            name="payment_method"
            render={({ field, fieldState }) => (
                <FormItem>
                    <OrderPaymentMethodSelect
                        invalid={fieldState.invalid}
                        value={field.value}
                        onChange={(value) => {
                            onChange(value as OrderFormData['payment_method']);
                        }}
                    />
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function PaymentAmountField({
    control,
    disabled,
    isPaidInFull,
    locked,
    onAmountChange,
    onPaidInFullChange,
    placeholder,
}: {
    control: Control<OrderFormData>;
    disabled: boolean;
    isPaidInFull: boolean;
    locked: boolean;
    onAmountChange: (value: string) => void;
    onPaidInFullChange: (checked: boolean | 'indeterminate') => void;
    placeholder: string;
}) {
    return (
        <FormField
            control={control}
            name="payment_amount"
            render={({ field, fieldState }) => (
                <FormItem>
                    <FormField
                        control={control}
                        name="is_paid_in_full"
                        render={({ field: checkboxField }) => (
                            <OrderPaymentAmountInput
                                disabled={disabled}
                                id="payment_amount"
                                inputName={field.name}
                                inputRef={field.ref}
                                invalid={fieldState.invalid}
                                isPaidInFull={
                                    isPaidInFull || checkboxField.value
                                }
                                locked={locked}
                                placeholder={placeholder}
                                value={field.value}
                                onAmountChange={onAmountChange}
                                onBlur={field.onBlur}
                                onPaidInFullChange={onPaidInFullChange}
                            />
                        )}
                    />
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function PaymentProofField({
    control,
    disabled,
    onClearErrors,
    onSetError,
}: {
    control: Control<OrderFormData>;
    disabled: boolean;
    onClearErrors: ReturnType<
        typeof useFormContext<OrderFormData>
    >['clearErrors'];
    onSetError: ReturnType<typeof useFormContext<OrderFormData>>['setError'];
}) {
    return (
        <FormField
            control={control}
            name="proof_image"
            render={({ field, fieldState }) => (
                <FormItem className="sm:col-span-2">
                    <OrderPaymentProofUpload
                        disabled={disabled}
                        invalid={Boolean(fieldState.error)}
                        value={field.value}
                        onRejectMessage={(message) => {
                            onSetError('proof_image', {
                                message,
                                type: 'validate',
                            });
                        }}
                        onValueChange={(file) => {
                            field.onChange(file);
                            onClearErrors('proof_image');
                        }}
                    />
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}

function setFormValue<TField extends FieldPath<OrderFormData>>(
    setValue: UseFormSetValue<OrderFormData>,
    field: TField,
    value: FieldPathValue<OrderFormData, TField>,
): void {
    setValue(field, value, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
    });
}

function syncField<TField extends FieldPath<OrderFormData>>(
    setValue: UseFormSetValue<OrderFormData>,
    field: TField,
    value: FieldPathValue<OrderFormData, TField>,
): void {
    setValue(field, value, {
        shouldDirty: true,
        shouldValidate: true,
    });
}

function formatPaymentAmountInput(value: string): string {
    const digits = normalizeOrderPaymentAmountInput(value);

    if (digits === '') {
        return '';
    }

    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function inferredPaymentType(
    paymentAmount: string,
    order: Order | null | undefined,
    paymentSummary: OrderFormPaymentSummary,
): OrderFormData['payment_type'] {
    return inferredOrderPaymentType({
        existingPaymentType: order?.payment_type,
        isCompleted: order?.status === 'completed',
        isPaid: order?.payment_status === 'paid',
        paymentAmount: numberValue(paymentAmount),
        previousPaid: paymentSummary.previousPaid,
        remainingBeforePayment: paymentSummary.remainingBeforePayment,
    });
}
