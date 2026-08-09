import { Head } from '@inertiajs/react';

import { PackageDetail } from '@/features/packages/components/shared/package-detail';
import { dashboard } from '@/routes';
import paket from '@/routes/paket';
import type { MenuPackage } from '@/types';

export default function PackageShow(props: {
    item?: MenuPackage | null;
    package?: MenuPackage | null;
}) {
    const item = props.item ?? props.package ?? null;

    if (!item) {
        return (
            <>
                <Head title="Detail Paket" />
                <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                    <div className="px-4 text-sm text-muted-foreground lg:px-6">
                        Paket tidak ditemukan.
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={item.name ? `Detail ${item.name}` : 'Detail Paket'} />

            <div className="@container/main flex flex-1 flex-col py-4 md:py-6">
                <div className="flex w-full flex-col gap-4 px-4 md:gap-5 lg:px-6">
                    <PackageDetail item={item} showThumbnails={false} />
                </div>
            </div>
        </>
    );
}

PackageShow.layout = (props: {
    item?: MenuPackage | null;
    package?: MenuPackage | null;
}) => {
    const item = props.item ?? props.package ?? null;

    return {
        title: 'Detail Paket',
        back: {
            label: 'Kembali ke Paket',
            href: paket.index(),
        },
        action:
            item?.id !== undefined
                ? {
                      label: 'Edit',
                      href: paket.edit(item.id),
                      icon: 'pencil' as const,
                  }
                : undefined,
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
                title: 'Detail',
                href:
                    item?.id !== undefined
                        ? paket.show(item.id)
                        : paket.index(),
            },
        ],
    };
};
