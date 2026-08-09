import { z } from 'zod';

export const packageDetailsFormSchema = z.object({
    description: z
        .string()
        .trim()
        .max(2000, 'Deskripsi maksimal 2000 karakter.'),
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
        .min(1, 'Nama paket wajib diisi.')
        .max(255, 'Nama paket maksimal 255 karakter.'),
    packageCategoryId: z.string(),
    packageCategoryIcon: z
        .string()
        .max(80, 'Ikon kategori maksimal 80 karakter.'),
    packageCategoryName: z
        .string()
        .trim()
        .max(255, 'Kategori maksimal 255 karakter.'),
});

export type PackageDetailsFormValues = z.infer<typeof packageDetailsFormSchema>;
