import { z } from 'zod';

export const categoryFormSchema = z.object({
    icon: z.string().trim().max(80, 'Ikon maksimal 80 karakter.'),
    isActive: z.boolean(),
    name: z
        .string()
        .trim()
        .min(1, 'Nama kategori wajib diisi.')
        .max(255, 'Nama kategori maksimal 255 karakter.'),
    type: z.enum(['menu', 'paket'], {
        error: 'Tipe kategori wajib dipilih.',
    }),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
