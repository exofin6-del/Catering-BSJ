import type { OrderFormData } from '@/features/orders/types/order-types';

export type OrderLocationField =
    | 'address_name'
    | 'event_address'
    | 'latitude'
    | 'longitude';

export type OrderFormErrors = Partial<
    Record<OrderLocationField, string | undefined>
>;

export type UpdateOrderFormField = (
    field: OrderLocationField,
    value: OrderFormData[OrderLocationField],
) => void;
