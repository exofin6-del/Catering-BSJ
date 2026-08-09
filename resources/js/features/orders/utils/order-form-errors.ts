import type { Errors } from '@inertiajs/core';
import type { FieldPath, UseFormSetError } from 'react-hook-form';

import {
    orderFormStepFields,
    orderFormSteps,
} from '../components/form/constants';
import type { OrderFormData } from '../types/order-types';

export const orderFormServerFieldMap: Record<
    string,
    FieldPath<OrderFormData>
> = {
    address_name: 'address_name',
    customer_name: 'customer_name',
    event_address: 'event_address',
    event_date: 'event_date',
    event_name: 'event_name',
    event_time: 'event_time',
    items: 'items',
    latitude: 'latitude',
    longitude: 'longitude',
    notes: 'notes',
    payment_amount: 'payment_amount',
    payment_method: 'payment_method',
    payment_paid_at: 'payment_paid_at',
    payment_type: 'payment_type',
    phone: 'phone',
    proof_image: 'proof_image',
    status: 'status',
};

export function applyOrderFormServerErrors(
    errors: Errors,
    setError: UseFormSetError<OrderFormData>,
): void {
    Object.entries(errors).forEach(([key, message]) => {
        const field = key.startsWith('items.')
            ? 'items'
            : orderFormServerFieldMap[key];

        if (!field) {
            return;
        }

        setError(field, {
            message: errorMessage(message),
            type: 'server',
        });
    });
}

export function resolveFirstOrderFormErrorStepIndex(errors: Errors): number {
    const clientKeys = Object.keys(errors)
        .map((key) =>
            key.startsWith('items.') ? 'items' : orderFormServerFieldMap[key],
        )
        .filter(
            (field): field is keyof OrderFormData =>
                field !== undefined && !field.includes('.'),
        );

    const stepIndex = orderFormSteps.findIndex((step) =>
        orderFormStepFields[step.id].some((field) =>
            clientKeys.includes(field),
        ),
    );

    return stepIndex >= 0 ? stepIndex : 0;
}

function errorMessage(message: string | string[]): string {
    return Array.isArray(message) ? message[0] : message;
}
