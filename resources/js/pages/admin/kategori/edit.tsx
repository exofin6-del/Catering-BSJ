import { Head } from '@inertiajs/react';

import { CategoryForm } from '@/features/categories/components/form/category-form';
import { dashboard } from '@/routes';
import categories from '@/routes/categories';
import type { CategoryRecord } from '@/types';

type CategoryEditProps = {
    category: CategoryRecord;
};

export default function CategoryEdit({ category }: CategoryEditProps) {
    return (
        <>
            <Head title="Edit Kategori" />

            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <CategoryForm mode="edit" category={category} />
            </div>
        </>
    );
}

CategoryEdit.layout = {
    title: 'Edit Kategori',
    description: 'Slug diperbarui otomatis mengikuti nama kategori.',
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
            title: 'Edit',
            href: categories.index(),
        },
    ],
};
