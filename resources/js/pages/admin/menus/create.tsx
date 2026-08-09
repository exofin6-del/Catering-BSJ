import { Head } from '@inertiajs/react';

import { MenuForm } from '@/features/menus/components/form/menu-form';
import type { MenuFormProps } from '@/features/menus/types/menu-types';
import { dashboard } from '@/routes';
import menu from '@/routes/menu';

export default function MenuCreate({ categories = [] }: MenuFormProps) {
    return (
        <>
            <Head title="Tambah Menu" />

            <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-5 md:py-6 lg:px-6">
                <MenuForm categories={categories} mode="create" />
            </div>
        </>
    );
}

MenuCreate.layout = {
    title: 'Tambah Menu',
    back: {
        label: 'Kembali ke Menu',
        href: menu.index(),
    },
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Menu',
            href: menu.index(),
        },
        {
            title: 'Tambah',
            href: menu.create(),
        },
    ],
};
