import { z } from 'zod';

import type { OrderFormData } from '../types/order-types';

const orderItemTypeValues = ['menu_item', 'package'] as const;
const orderPaymentMethodValues = ['', 'transfer', 'cash'] as const;
const orderPaymentTypeValues = ['dp', 'full'] as const;
const orderStatusValues = [
    'pending_confirmation',
    'confirmed',
    'completed',
    'canceled',
] as const;

function requiredText(label: string, max = 255) {
    return z
        .string()
        .trim()
        .min(1, `${label} wajib diisi.`)
        .max(max, `${label} maksimal ${max} karakter.`);
}

function optionalNumericText(
    label: string,
    {
        max,
        min,
    }: {
        max?: number;
        min?: number;
    } = {},
) {
    return z
        .string()
        .trim()
        .refine((value) => value === '' || Number.isFinite(Number(value)), {
            message: `${label} harus berupa angka.`,
        })
        .refine(
            (value) =>
                value === '' || min === undefined || Number(value) >= min,
            {
                message: `${label} minimal ${min}.`,
            },
        )
        .refine(
            (value) =>
                value === '' || max === undefined || Number(value) <= max,
            {
                message: `${label} maksimal ${max}.`,
            },
        );
}

const orderSelectedItemSchema = z.object({
    menu_item_id: z.string(),
    package_item_id: z.string(),
});

const paymentProofSchema = z
    .custom<File | null>(
        (value) => value === null || isBrowserFile(value),
        'Bukti pembayaran harus berupa gambar.',
    )
    .refine(
        (value) => value === null || value.type.startsWith('image/'),
        'Bukti pembayaran harus berupa gambar.',
    );

const orderItemSchema = z
    .object({
        item_type: z.enum(orderItemTypeValues),
        menu_item_id: z.string(),
        package_id: z.string(),
        qty: z
            .string()
            .trim()
            .min(1, 'Qty wajib diisi.')
            .refine((value) => Number.isInteger(Number(value)), {
                message: 'Qty harus berupa angka bulat.',
            })
            .refine((value) => Number(value) >= 1, {
                message: 'Qty minimal 1.',
            }),
        selected_items: z.array(orderSelectedItemSchema),
    })
    .superRefine((item, context) => {
        if (item.item_type === 'menu_item' && item.menu_item_id.trim() === '') {
            context.addIssue({
                code: 'custom',
                message: 'Menu wajib dipilih.',
                path: ['menu_item_id'],
            });
        }

        if (item.item_type === 'package' && item.package_id.trim() === '') {
            context.addIssue({
                code: 'custom',
                message: 'Paket wajib dipilih.',
                path: ['package_id'],
            });
        }
    });

const orderFormBase = z.object({
    address_name: z.string().trim(),
    customer_name: requiredText('Nama pelanggan'),
    event_address: z.string().trim(),
    event_date: z.string().trim().min(1, 'Tanggal acara wajib diisi.'),
    event_name: requiredText('Nama acara'),
    event_time: z
        .string()
        .trim()
        .regex(/^$|^\d{2}:\d{2}$/, 'Jam acara harus berformat HH:mm.'),
    is_paid_in_full: z.boolean(),
    items: z
        .array(orderItemSchema)
        .min(1, 'Tambahkan minimal satu item order.'),
    latitude: optionalNumericText('Latitude', { max: 90, min: -90 }),
    longitude: optionalNumericText('Longitude', { max: 180, min: -180 }),
    notes: z.string().trim(),
    payment_amount: optionalNumericText('Nominal dibayar', { min: 0 }),
    payment_method: z.enum(orderPaymentMethodValues),
    payment_paid_at: z.string().trim(),
    proof_image: paymentProofSchema,
    payment_type: z.union([z.enum(orderPaymentTypeValues), z.literal('')]),
    phone: requiredText('No. HP', 20),
    status: z.enum(orderStatusValues),
});

// Admin schema: event_address is optional
export const orderFormSchema = orderFormBase.superRefine((values, context) => {
    if (values.payment_type === '') {
        context.addIssue({
            code: 'custom',
            message: 'Tipe pembayaran wajib dipilih.',
            path: ['payment_type'],
        });
    }

    if (values.payment_amount.trim() === '') {
        return;
    }

    if (values.payment_method === '') {
        context.addIssue({
            code: 'custom',
            message: 'Metode pembayaran wajib dipilih.',
            path: ['payment_method'],
        });
    }
});

// Customer schema: all fields are required except notes (catatan)
export const customerOrderFormSchema = orderFormBase
    .extend({
        address_name: z.string().trim().min(1, 'Nama alamat wajib diisi.'),
        event_address: z.string().trim().min(1, 'Lokasi acara wajib diisi.'),
        event_time: z
            .string()
            .trim()
            .regex(/^\d{2}:\d{2}$/, 'Jam acara wajib diisi.'),
        latitude: z
            .string()
            .trim()
            .min(1, 'Latitude wajib diisi.')
            .refine((value) => Number.isFinite(Number(value)), {
                message: 'Latitude harus berupa angka.',
            })
            .refine((value) => Number(value) >= -90 && Number(value) <= 90, {
                message: 'Latitude harus antara -90 dan 90.',
            }),
        longitude: z
            .string()
            .trim()
            .min(1, 'Longitude wajib diisi.')
            .refine((value) => Number.isFinite(Number(value)), {
                message: 'Longitude harus berupa angka.',
            })
            .refine((value) => Number(value) >= -180 && Number(value) <= 180, {
                message: 'Longitude harus antara -180 dan 180.',
            }),
    })
    .superRefine((values, context) => {
        if (values.payment_type === '') {
            context.addIssue({
                code: 'custom',
                message: 'Tipe pembayaran wajib dipilih.',
                path: ['payment_type'],
            });
        }

        if (values.payment_amount.trim() === '') {
            return;
        }

        if (values.payment_method === '') {
            context.addIssue({
                code: 'custom',
                message: 'Metode pembayaran wajib dipilih.',
                path: ['payment_method'],
            });
        }
    });

export type OrderFormValues = OrderFormData;

function isBrowserFile(value: unknown): value is File {
    return typeof File !== 'undefined' && value instanceof File;
}
