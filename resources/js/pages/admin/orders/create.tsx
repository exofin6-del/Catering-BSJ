import { Head } from '@inertiajs/react';

import { OrderForm } from '@/features/orders/components/form/order-form';
import type { OrderFormProps } from '@/features/orders/types/order-types';
import { dashboard } from '@/routes';
import orderRoute from '@/routes/order';

export default function OrderCreate(props: OrderFormProps) {
    return (
        <>
            <Head title="Tambah Order" />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-col px-4 lg:px-6">
                    <OrderForm
                        businessSetting={props.businessSetting}
                        menuItems={props.menuItems ?? []}
                        packages={props.packages ?? []}
                        submitLabel="Simpan"
                    />
                </div>
            </div>
        </>
    );
}

OrderCreate.layout = {
    title: 'Tambah Order',
    description: 'Catat order pelanggan dari menu atau paket aktif.',
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
            title: 'Tambah',
            href: orderRoute.create(),
        },
    ],
};
