import { z } from 'zod';

const priceSchema = (label: string) =>
    z
        .string()
        .trim()
        .min(1, `${label} wajib diisi.`)
        .refine((value) => Number.isFinite(Number(value)), {
            message: `${label} harus berupa angka.`,
        })
        .refine((value) => Number(value) >= 0, {
            message: `${label} tidak boleh minus.`,
        });

const optionalPriceSchema = (label: string) =>
    z
        .string()
        .trim()
        .refine(
            (value) => value === '' || Number.isFinite(Number(value)),
            `${label} harus berupa angka.`,
        )
        .refine(
            (value) => value === '' || Number(value) >= 0,
            `${label} tidak boleh minus.`,
        );

export const menuFormSchema = z
    .object({
        basePrice: priceSchema('Harga dasar'),
        categoryId: z.string(),
        categoryIcon: z.string().max(80, 'Ikon kategori maksimal 80 karakter.'),
        categoryName: z
            .string()
            .trim()
            .max(255, 'Kategori maksimal 255 karakter.'),
        description: z.string().trim().max(3000, 'Deskripsi terlalu panjang.'),
        isActive: z.boolean(),
        isRecommended: z.boolean(),
        minOrder: z
            .string()
            .trim()
            .min(1, 'Minimal order wajib diisi.')
            .refine((value) => Number.isInteger(Number(value)), {
                message: 'Minimal order harus berupa angka bulat.',
            })
            .refine((value) => Number(value) >= 1, {
                message: 'Minimal order minimal 1.',
            }),
        name: z
            .string()
            .trim()
            .min(1, 'Nama menu wajib diisi.')
            .max(255, 'Nama menu maksimal 255 karakter.'),
        promoPrice: optionalPriceSchema('Harga promo'),
    })
    .superRefine((values, context) => {
        if (
            values.promoPrice !== '' &&
            Number(values.promoPrice) > Number(values.basePrice)
        ) {
            context.addIssue({
                code: 'custom',
                message:
                    'Harga promo tidak boleh lebih besar dari harga dasar.',
                path: ['promoPrice'],
            });
        }
    });

export type MenuFormValues = z.infer<typeof menuFormSchema>;
