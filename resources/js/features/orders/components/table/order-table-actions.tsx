import { DataTableQuickActionButton } from '@/components/data-table';
import orderRoute from '@/routes/order';
import payments from '@/routes/order/payments';
import type { Order } from '@/types';
import type { RouteDefinition } from '@/wayfinder';

import { numberValue } from '../../utils/order-format';

export function getSettleButtonLabel(order: Order): string {
    return order.payment_status === 'unpaid' ? 'Pembayaran' : 'Pelunasan';
}

export function getSettleHref(order: Order): RouteDefinition<'get'> {
    return order.payment_status === 'unpaid'
        ? orderRoute.payPage(order.id)
        : payments.create(order.id);
}

export function canConfirmOrder(order: Order, canChangeStatus: boolean) {
    return canChangeStatus && order.status === 'pending_confirmation';
}

export function canCancelOrder(order: Order, canChangeStatus: boolean) {
    return (
        canChangeStatus &&
        order.status === 'pending_confirmation' &&
        order.payment_status === 'unpaid' &&
        !order.payments.some((payment) => numberValue(payment.amount) > 0)
    );
}

export function canSettleOrder(order: Order) {
    return (
        order.status !== 'pending_confirmation' &&
        order.status !== 'canceled' &&
        order.payment_status !== 'paid' &&
        numberValue(order.remaining_amount) > 0
    );
}

export function canCompleteOrder(order: Order, canChangeStatus: boolean) {
    return (
        canChangeStatus &&
        order.status === 'confirmed' &&
        order.payment_status === 'paid' &&
        numberValue(order.remaining_amount) <= 0
    );
}

export function canViewOrderReceipt(order: Order) {
    return order.payments.some((payment) => numberValue(payment.amount) > 0);
}

export { DataTableQuickActionButton as OrderQuickActionButton };
