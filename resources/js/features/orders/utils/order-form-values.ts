import type {
    Order,
    OrderMenuItem,
    OrderPackage,
    OrderPackageChoice,
    OrderPackageItem,
    OrderPayment,
    OrderPaymentStatus,
} from '@/types';

import type { OrderFormData, OrderFormItem } from '../types/order-types';
import { numberValue, orderPaidAmount } from './order-format';
import { recommendedOrderPaymentAmount } from './order-payment-logic';

export type OrderFormSummary = {
    subtotal: number;
    total: number;
};

export type OrderFormPaymentSummary = {
    canRecordPayment: boolean;
    currentPayment: number;
    currentStatus: OrderPaymentStatus;
    previousPaid: number;
    projectedPaid: number;
    projectedStatus: OrderPaymentStatus;
    recommendedPaymentAmount: number;
    remaining: number;
    remainingBeforePayment: number;
    total: number;
};

export function initialOrderFormData(order?: Order | null): OrderFormData {
    return {
        address_name: order?.address_name ?? '',
        customer_name: order?.customer_name ?? '',
        event_address: order?.event_address ?? '',
        event_date: order?.event_date ?? '',
        event_name: order?.event_name ?? '',
        event_time: order?.event_time?.slice(0, 5) ?? '',
        is_paid_in_full: false,
        items:
            order?.items.map((item) => ({
                item_type: item.item_type,
                menu_item_id: item.menu_item_id
                    ? String(item.menu_item_id)
                    : '',
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
            })) ?? [],
        latitude: order?.latitude ? String(order.latitude) : '',
        longitude: order?.longitude ? String(order.longitude) : '',
        notes: order?.notes ?? '',
        payment_amount: '',
        payment_method: '',
        payment_paid_at: '',
        proof_image: null,
        payment_type: order?.payment_type ?? 'full',
        phone: order?.phone ?? '',
        status: order?.status ?? 'confirmed',
    };
}

export function buildOrderPayload(data: OrderFormData, order?: Order | null) {
    const hasPaymentAmount = data.payment_amount.trim() !== '';
    const paymentAmount = hasPaymentAmount
        ? paymentAmountForSubmission(data.payment_amount, order)
        : null;

    return {
        ...data,
        items: data.items.map((item) => ({
            item_type: item.item_type,
            menu_item_id:
                item.item_type === 'menu_item' ? item.menu_item_id : null,
            package_id: item.item_type === 'package' ? item.package_id : null,
            qty: item.qty,
            selected_items:
                item.item_type === 'package'
                    ? validSelectedPackageItems(item)
                    : [],
        })),
        payment_amount: paymentAmount,
        payment_method: data.payment_method || null,
        payment_paid_at: hasPaymentAmount ? currentLocalDateTime() : null,
        proof_image: hasPaymentAmount ? data.proof_image : null,
    };
}

export function orderFormPaymentSummary(
    total: number,
    paymentAmount: string,
    paymentMethod: OrderFormData['payment_method'],
    paymentType: OrderFormData['payment_type'],
    order?: Order | null,
): OrderFormPaymentSummary {
    const normalizedTotal = Math.max(0, total);
    const previousPaid = order ? orderPaidAmount(order) : 0;
    const remainingBeforePayment = Math.max(0, normalizedTotal - previousPaid);
    const canRecordPayment = !order || remainingBeforePayment > 0;
    const resolvedPaymentType = paymentType || order?.payment_type || 'full';
    const requestedPayment =
        canRecordPayment && Boolean(paymentMethod)
            ? Math.max(0, numberValue(paymentAmount))
            : 0;
    const currentPayment = Math.min(requestedPayment, remainingBeforePayment);
    const projectedPaid = Math.min(
        normalizedTotal,
        previousPaid + currentPayment,
    );

    return {
        canRecordPayment,
        currentPayment,
        currentStatus: paymentStatus(normalizedTotal, previousPaid),
        previousPaid,
        projectedPaid,
        projectedStatus: paymentStatus(normalizedTotal, projectedPaid),
        recommendedPaymentAmount: recommendedOrderPaymentAmount({
            dpAmount: order ? numberValue(order.dp_amount) : 0,
            paymentType: resolvedPaymentType,
            previousPaid,
            total: normalizedTotal,
        }),
        remaining: Math.max(0, normalizedTotal - projectedPaid),
        remainingBeforePayment,
        total: normalizedTotal,
    };
}

export function orderFormSummary(
    items: OrderFormItem[],
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): OrderFormSummary {
    const subtotal = items.reduce((total, item) => {
        const qty = Math.max(1, Number(item.qty || 1));

        return total + orderFormItemUnitPrice(item, menuItems, packages) * qty;
    }, 0);

    return {
        subtotal,
        total: subtotal,
    };
}

export function orderFormItemUnitPrice(
    item: OrderFormItem,
    menuItems: OrderMenuItem[],
    packages: OrderPackage[],
): number {
    if (item.item_type === 'package') {
        const selectedPackage = packages.find(
            (menuPackage) => String(menuPackage.id) === item.package_id,
        );

        return selectedPackagePrice(item, selectedPackage);
    }

    const menuItem = menuItems.find(
        (currentItem) => String(currentItem.id) === item.menu_item_id,
    );

    return menuItemPrice(menuItem);
}

function menuItemPrice(item?: OrderMenuItem): number {
    if (!item) {
        return 0;
    }

    return numberValue(item.promo_price ?? item.price ?? item.base_price);
}

export function selectedPackagePrice(
    item: OrderFormItem,
    selectedPackage?: OrderPackage,
): number {
    if (!selectedPackage) {
        return 0;
    }

    if (selectedPackage.items.length === 0) {
        return numberValue(selectedPackage.price);
    }

    const componentTotal = selectedPackage.items.reduce(
        (total, packageItem) =>
            total + selectedPackageItemPrice(item, packageItem),
        0,
    );

    return componentTotal > 0
        ? componentTotal
        : numberValue(selectedPackage.price);
}

function selectedPackageItemPrice(
    item: OrderFormItem,
    packageItem: OrderPackageItem,
): number {
    if (packageItem.item_prices.length > 0) {
        return packageChoicePrice(
            selectedPackageChoice(item, packageItem) ??
                defaultPackageChoice(packageItem),
        );
    }

    return numberValue(
        packageItem.package_price ??
            packageItem.menu_item?.promo_price ??
            packageItem.menu_item?.base_price,
    );
}

export function packageChoicePrice(choice?: OrderPackageChoice): number {
    if (!choice) {
        return 0;
    }

    return numberValue(
        choice.package_price ??
            choice.menu_item?.promo_price ??
            choice.menu_item?.base_price,
    );
}

export function defaultPackageChoice(
    packageItem: OrderPackageItem,
): OrderPackageChoice | undefined {
    if (packageItem.item_prices.length === 0) {
        return undefined;
    }

    if (packageItem.menu_item_id) {
        const defaultChoice = packageItem.item_prices.find(
            (price) =>
                String(price.menu_item_id) === String(packageItem.menu_item_id),
        );

        if (defaultChoice) {
            return defaultChoice;
        }
    }

    return (
        packageItem.item_prices.find((price) => price.is_recommended) ??
        packageItem.item_prices[0]
    );
}

function selectedPackageChoice(
    item: OrderFormItem,
    packageItem: OrderPackageItem,
): OrderPackageChoice | undefined {
    const selectedMenuItemId = item.selected_items.find(
        (selectedItem) =>
            selectedItem.package_item_id === String(packageItem.id),
    )?.menu_item_id;

    if (!selectedMenuItemId) {
        return undefined;
    }

    return packageItem.item_prices.find(
        (choice) => String(choice.menu_item_id) === selectedMenuItemId,
    );
}

function validSelectedPackageItems(item: OrderFormItem) {
    return item.selected_items.filter(
        (selectedItem) =>
            selectedItem.package_item_id.trim() !== '' &&
            selectedItem.menu_item_id.trim() !== '',
    );
}

function paymentAmountForSubmission(
    paymentAmount: string,
    order?: Order | null,
): string {
    const currentPayment = Math.max(0, numberValue(paymentAmount));

    if (!order || currentPayment <= 0) {
        return paymentAmount;
    }

    return String(editablePaymentAmount(order) + currentPayment);
}

function editablePaymentAmount(order: Order): number {
    const payment = editablePayment(order);

    return payment ? numberValue(payment.amount) : 0;
}

function editablePayment(order: Order): OrderPayment | undefined {
    return [...order.payments]
        .sort((first, second) => first.id - second.id)
        .find((payment) => {
            if (!['transfer', 'cash'].includes(payment.method)) {
                return false;
            }

            return order.payment_type !== 'dp' || payment.type === 'remaining';
        });
}

function paymentStatus(total: number, paidAmount: number): OrderPaymentStatus {
    if (paidAmount <= 0) {
        return 'unpaid';
    }

    return paidAmount >= total ? 'paid' : 'dp_paid';
}

function currentLocalDateTime(): string {
    const now = new Date();
    const localTime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60_000,
    );

    return localTime.toISOString().slice(0, 19);
}
