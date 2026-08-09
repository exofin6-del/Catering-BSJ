import { Head } from '@inertiajs/react';

import { PackageForm } from '@/features/packages/components/form/package-form';
import type { PackageFormProps } from '@/features/packages/types/package-types';
import { dashboard } from '@/routes';
import paket from '@/routes/paket';

export default function PackageEdit(props: PackageFormProps) {
    const item = props.item ?? props.package ?? null;

    return (
        <>
            <Head title={item?.name ? `Edit ${item.name}` : 'Edit Paket'} />

            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <PackageForm
                    item={item}
                    menuItems={props.menuItems ?? []}
                    packageCategories={props.packageCategories ?? []}
                    mode="edit"
                />
            </div>
        </>
    );
}

PackageEdit.layout = (props: PackageFormProps) => {
    const item = props.item ?? props.package ?? null;

    return {
        title: 'Edit Paket',
        description: item?.name ?? 'Perbarui detail paket.',
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
                title: 'Edit',
                href:
                    item?.id !== undefined
                        ? paket.edit(item.id)
                        : paket.index(),
            },
        ],
    };
};
