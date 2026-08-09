import { Head } from '@inertiajs/react';

import { PackageForm } from '@/features/packages/components/form/package-form';
import type { PackageFormProps } from '@/features/packages/types/package-types';
import { dashboard } from '@/routes';
import paket from '@/routes/paket';

export default function PackageCreate({
    menuItems = [],
    packageCategories = [],
}: PackageFormProps) {
    return (
        <>
            <Head title="Tambah Paket" />

            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <PackageForm
                    menuItems={menuItems}
                    packageCategories={packageCategories}
                    mode="create"
                />
            </div>
        </>
    );
}

PackageCreate.layout = {
    title: 'Tambah Paket',
    description: 'Susun paket dari menu aktif dan atur publikasinya.',
    back: {
        label: 'Kembali ke Paket',
        href: paket.index(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Paket',
            href: paket.index(),
        },
        {
            title: 'Tambah',
            href: paket.create(),
        },
    ],
};
