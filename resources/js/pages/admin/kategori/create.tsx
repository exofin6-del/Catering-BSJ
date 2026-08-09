import { Head } from '@inertiajs/react';

import { CategoryForm } from '@/features/categories/components/form/category-form';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';
import type { CategoryType } from '@/types';

type CategoryCreateProps = {
    type?: CategoryType;
};

export default function CategoryCreate({ type = 'menu' }: CategoryCreateProps) {
    return (
        <>
            <Head title="Tambah Kategori" />

            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <CategoryForm mode="create" initialType={type} />
            </div>
        </>
    );
}

CategoryCreate.layout = {
    title: 'Tambah Kategori',
    description: 'Pilih tipe kategori untuk menu atau paket.',
    back: {
        label: 'Kembali ke Kategori',
        href: categories.index(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Kategori',
            href: categories.index(),
        },
        {
            title: 'Tambah',
            href: categories.create(),
        },
    ],
};
