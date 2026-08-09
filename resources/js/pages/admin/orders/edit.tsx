import { Head } from '@inertiajs/react';

import { OrderForm } from '@/features/orders/components/form/order-form';
import type { OrderFormProps } from '@/features/orders/types/order-types';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';

export default function OrderEdit(props: OrderFormProps) {
    const order = props.order ?? null;

    return (
        <>
            <Head
                title={
                    order?.order_code
                        ? `Edit ${order.order_code}`
                        : 'Edit Order'
                }
            />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-1 flex-col px-4 lg:px-6">
                    <OrderForm
                        businessSetting={props.businessSetting}
                        menuItems={props.menuItems ?? []}
                        order={order}
                        packages={props.packages ?? []}
                        submitLabel="Simpan perubahan"
                    />
                </div>
            </div>
        </>
    );
}

OrderEdit.layout = ({ order }: OrderFormProps) => ({
    title: 'Edit Order',
    description: order?.order_code ?? 'Perbarui data order.',
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
            title: 'Edit',
            href: order?.id ? orderRoute.edit(order.id) : orderRoute.index(),
        },
    ],
});
