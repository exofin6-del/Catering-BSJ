import { Head } from '@inertiajs/react';
import Heading from '@/components/shared/heading';
import AppearanceTabs from '@/features/settings/components/appearance-tabs';
import { edit as editAppearance } from '@/routes/appearance';

export default function Appearance() {
    return (
        <>
            <Head title="Tampilan" />

            <h1 className="sr-only">Tampilan</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Tampilan"
                    description="Atur tema warna storefront yang ditampilkan kepada customer."
                />
                <AppearanceTabs />
            </div>
        </>
    );
}

Appearance.layout = {
    title: 'Pengaturan',
    breadcrumbs: [
        {
            title: 'Tampilan',
            href: editAppearance(),
        },
    ],
};
