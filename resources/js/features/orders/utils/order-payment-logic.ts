export type OrderPaymentAmountMode = 'disabled' | 'editable' | 'fixed';
export type InferredOrderPaymentType = 'dp' | 'full';
export type PendingOrderPaymentKind = 'dp' | 'full' | 'partial' | 'remaining';

type PaymentAmountModeInput = {
    canRecordPayment: boolean;
    paymentMethod?: string;
    paymentType: '' | 'dp' | 'full';
    previousPaid: number;
};

type RecommendedPaymentAmountInput = {
    dpAmount?: number;
    paymentType: '' | 'dp' | 'full';
    previousPaid: number;
    total: number;
};

type PendingOrderPaymentKindInput = {
    paymentAmount: number;
    paymentType: '' | 'dp' | 'full';
    previousPaid: number;
    total: number;
};

type InferredOrderPaymentTypeInput = {
    existingPaymentType?: '' | InferredOrderPaymentType;
    isCompleted?: boolean;
    isPaid?: boolean;
    paymentAmount: number;
    previousPaid: number;
    remainingBeforePayment: number;
};

export function orderPaymentAmountMode({
    canRecordPayment,
    previousPaid,
}: PaymentAmountModeInput): OrderPaymentAmountMode {
    if (!canRecordPayment) {
        return 'disabled';
    }

    if (previousPaid > 0) {
        return 'fixed';
    }

    return 'editable';
}

export function recommendedOrderPaymentAmount({
    dpAmount = 0,
    paymentType,
    previousPaid,
    total,
}: RecommendedPaymentAmountInput): number {
    const normalizedTotal = Math.max(0, total);
    const normalizedPreviousPaid = Math.max(0, previousPaid);
    const remaining = Math.max(0, normalizedTotal - normalizedPreviousPaid);

    if (remaining <= 0 || paymentType === '') {
        return 0;
    }

    if (normalizedPreviousPaid > 0 || paymentType === 'full') {
        return Math.round(remaining);
    }

    const configuredDpAmount = dpAmount > 0 ? dpAmount : normalizedTotal * 0.5;

    return Math.round(Math.min(remaining, configuredDpAmount));
}

export function normalizeOrderPaymentAmountInput(
    value: string,
    maximum?: number,
): string {
    const digits = value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');

    if (digits === '') {
        return '';
    }

    if (maximum === undefined) {
        return digits;
    }

    const normalizedMaximum = Math.max(0, Math.floor(maximum));

    if (normalizedMaximum === 0) {
        return '';
    }

    return String(Math.min(Number(digits), normalizedMaximum));
}

export function orderPaymentAmountFormValue(value: number): string {
    return value > 0 ? String(Math.round(value)) : '';
}

export function inferredOrderPaymentType({
    existingPaymentType,
    isCompleted = false,
    isPaid = false,
    paymentAmount,
    previousPaid,
    remainingBeforePayment,
}: InferredOrderPaymentTypeInput): InferredOrderPaymentType {
    if (
        existingPaymentType &&
        (existingPaymentType === 'dp' ||
            previousPaid > 0 ||
            isPaid ||
            isCompleted)
    ) {
        return existingPaymentType;
    }

    const normalizedPaymentAmount = Math.max(0, paymentAmount);
    const normalizedRemainingAmount = Math.max(0, remainingBeforePayment);

    if (
        normalizedPaymentAmount > 0 &&
        normalizedPaymentAmount < normalizedRemainingAmount
    ) {
        return 'dp';
    }

    return 'full';
}

export function pendingOrderPaymentKind({
    paymentAmount,
    paymentType,
    previousPaid,
    total,
}: PendingOrderPaymentKindInput): PendingOrderPaymentKind | null {
    const normalizedPaymentAmount = Math.max(0, paymentAmount);

    if (normalizedPaymentAmount <= 0) {
        return null;
    }

    const normalizedPreviousPaid = Math.max(0, previousPaid);
    const normalizedTotal = Math.max(0, total);
    const projectedPaid = normalizedPreviousPaid + normalizedPaymentAmount;

    if (normalizedTotal > 0 && projectedPaid >= normalizedTotal) {
        return normalizedPreviousPaid > 0 ? 'remaining' : 'full';
    }

    if (paymentType === 'dp' && normalizedPreviousPaid <= 0) {
        return 'dp';
    }

    return 'partial';
}
