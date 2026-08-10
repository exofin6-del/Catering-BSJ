import { Head } from '@inertiajs/react';
import { Sparkles, CalendarRange } from 'lucide-react';
import { CustomerLocation } from '@/features/customers/components/customer-location';
import type { CustomerStorefrontProps } from '@/features/customers/types/customer-storefront-types';
import { useCustomerTheme } from '@/lib/hooks/use-customer-theme';

export default function CustomerV2InfoPage({
    business,
}: CustomerStorefrontProps) {
    useCustomerTheme();

    return (
        <>
            <Head title="Tentang Kami" />

            <div className="space-y-6 py-4 sm:space-y-8 sm:py-6 lg:space-y-10 lg:py-8">
                {/* Our Story Section */}
                <section className="overflow-hidden">
                    <div className="grid lg:grid-cols-2">
                        {/* Image */}
                        <div className="relative min-h-[260px] overflow-hidden rounded-md sm:min-h-[340px] lg:min-h-full">
                            <img
                                src="/images/our-story.jpg"
                                alt="Hidangan catering kami"
                                className="absolute inset-0 size-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black/30 lg:to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="flex flex-col justify-center py-3 lg:p-12">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                                        Tentang Kami
                                    </p>

                                    <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                                        Hidangan yang dibuat untuk setiap momen.
                                    </h2>
                                </div>

                                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                    <p>
                                        Kami menghadirkan pilihan menu catering
                                        yang praktis, lezat, dan mudah dipesan
                                        untuk berbagai kebutuhan acara.
                                    </p>
                                    <p>
                                        Dari acara keluarga hingga kebutuhan
                                        kantor, kami membantu menyiapkan
                                        hidangan yang sesuai dengan kebutuhan
                                        Anda.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-border/60 pt-5">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                            <CalendarRange className="size-4 text-primary" />
                                            <span>Menu Beragam</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Pilihan untuk berbagai acara
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                            <Sparkles className="size-4 text-primary" />
                                            <span>Pesan Online</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Praktis dari mana saja
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Location Section */}
                <section className="overflow-hidden">
                    <CustomerLocation business={business} />
                </section>
            </div>
        </>
    );
}

CustomerV2InfoPage.layout = {
    title: 'Info',
    description: 'Informasi lengkap layanan catering.',
};
