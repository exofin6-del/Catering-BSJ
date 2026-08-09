import { Head } from '@inertiajs/react';
import { CustomerSearchResults } from '@/features/customers/components/customer-search-results';
import { CustomerWhatsAppButton } from '@/features/customers/components/customer-whatsapp-button';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';
import CustomerSearchLayout from '@/layouts/customer/customer-search-layout';
import { home } from '@/routes';

type CustomerV2SearchPageProps = CustomerStorefrontProps & {
    query: string;
};

export default function CustomerV2SearchPage({
    business,
    menuItems,
    packages,
    query,
}: CustomerV2SearchPageProps) {
    return (
        <>
            <Head title={`Cari - ${business.name}`} />

            <div className="min-h-screen bg-background text-foreground">
                <CustomerWhatsAppButton business={business} />

                <div className="scroll-mt-20 pt-4">
                    <CustomerSearchResults
                        menuItems={menuItems}
                        packages={packages}
                        query={query}
                    />
                </div>
            </div>
        </>
    );
}

CustomerV2SearchPage.layout = (page: React.ReactNode) => (
    <CustomerSearchLayout backHref={home.url()} backLabel="Kembali ke Beranda">
        {page}
    </CustomerSearchLayout>
);
