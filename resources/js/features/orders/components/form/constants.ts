import { ClipboardList, CreditCard, Info } from 'lucide-react';

import type { FormWizardStepDefinition } from '@/components/shared/form-wizard';

import type { OrderFormData } from '../../types/order-types';
import type { OrderFormStep } from './types';

export const ORDER_FORM_ID = 'order-form';

export const orderFormSteps: FormWizardStepDefinition<OrderFormStep>[] = [
    {
        id: 'customer',
        title: 'Informasi Pelanggan',
        description: 'Pemesan, jadwal, dan lokasi acara.',
        icon: Info,
    },
    {
        id: 'items',
        title: 'Item order',
        description: 'Menu satuan atau paket.',
        icon: ClipboardList,
    },
    {
        id: 'payment',
        title: 'Pembayaran',
        description: 'Tipe dan metode pembayaran.',
        icon: CreditCard,
    },
];

export const orderFormStepFields: Record<
    OrderFormStep,
    (keyof OrderFormData)[]
> = {
    customer: [
        'customer_name',
        'phone',
        'event_date',
        'event_time',
        'event_name',
        'address_name',
        'event_address',
        'latitude',
        'longitude',
        'notes',
    ],
    items: ['items'],
    payment: [
        'payment_type',
        'payment_amount',
        'payment_method',
        'proof_image',
        'status',
    ],
};
