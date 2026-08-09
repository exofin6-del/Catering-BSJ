import {  ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { customerWhatsAppUrl } from '@/features/customers/utils/customer-whatsapp';
import type {
    CustomerBusiness,
    CustomerCatalogItem,
} from '../types/customer-storefront-types';

export function CustomerHero({
    business,
    items,
}: {
    business: CustomerBusiness;
    items: CustomerCatalogItem[];
}) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const heroImages = business.hero_images ?? [];

    const whatsappHref = customerWhatsAppUrl(
        business.whatsapp_number,
        `Halo ${business.name}, saya ingin bertanya tentang layanan catering.`,
    );

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.max(heroImages.length, 1));
    }, [heroImages.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide(
            (prev) =>
                (prev - 1 + Math.max(heroImages.length, 1)) %
                Math.max(heroImages.length, 1),
        );
    }, [heroImages.length]);

    useEffect(() => {
        if (heroImages.length < 2) {
            return;
        }

        const interval = setInterval(() => {
            nextSlide();
        }, 5000);

        return () => clearInterval(interval);
    }, [heroImages.length, nextSlide]);

    const featuredItem =
        items.find(
            (entry) => entry.item.is_recommended && entry.item.primary_image,
        ) ?? items.find((entry) => entry.item.primary_image);

    return (
        <section className="scroll-mt-20 pt-4">
            <div className="group/slide relative mx-auto aspect-16/9 w-full overflow-hidden rounded-3xl bg-primary text-primary-foreground shadow-xl sm:aspect-auto">
                {heroImages.length > 0 ? (
                    <>
                        {heroImages.map((image, i) => (
                            <img
                                key={i}
                                src={image}
                                alt={`Hero ${i + 1}`}
                                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${
                                    i === currentSlide
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                }`}
                            />
                        ))}
                        {heroImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={prevSlide}
                                    className="absolute top-1/2 left-4 z-10 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white opacity-0 transition-opacity group-hover/slide:opacity-100 hover:bg-black/50"
                                    aria-label="Sebelumnya"
                                >
                                    <ChevronLeft className="size-5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextSlide}
                                    className="absolute top-1/2 right-4 z-10 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white opacity-0 transition-opacity group-hover/slide:opacity-100 hover:bg-black/50"
                                    aria-label="Selanjutnya"
                                >
                                    <ChevronRight className="size-5" />
                                </button>
                                <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                                    {heroImages.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setCurrentSlide(i)}
                                            className={`size-2 rounded-full transition-all ${
                                                i === currentSlide
                                                    ? 'w-5 bg-white'
                                                    : 'bg-white/50 hover:bg-white/70'
                                            }`}
                                            aria-label={`Slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                ) : featuredItem?.item.primary_image ? (
                    <img
                        src={featuredItem.item.primary_image}
                        alt={featuredItem.item.name}
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : null}

                {/* Base dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent sm:bg-gradient-to-r sm:from-black/30 sm:via-black/10 sm:to-transparent" />

                {/* Primary backdrop — left-to-right, full hero height, theme-aware */}
                <div className="absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-primary/90 via-primary/60 to-transparent" />

                {/* Hero Content — vertically centered, left-aligned */}
                <div className="relative flex min-h-full w-full flex-col justify-center gap-4 p-5 sm:min-h-[460px] sm:gap-6 sm:p-10 lg:min-h-[500px] lg:max-w-3xl lg:p-14">

                    <div className="relative grid gap-1.5 sm:gap-4">
                        <h1 className="max-w-[16rem] text-2xl leading-tight font-bold tracking-tight text-white sm:max-w-2xl sm:text-4xl sm:leading-[1.05] sm:font-semibold lg:text-5xl">
                            Hidangan Istimewa Untuk Momen Spesial
                        </h1>
                        <p className="max-w-[14rem] text-sm leading-relaxed text-white/80 sm:max-w-xl sm:text-base lg:text-lg">
                            Pilih menu satuan atau paket lengkap.
                        </p>
                    </div>

                    {/* CTA Buttons — hidden on mobile, visible on sm+ */}
                    <div className="hidden flex-wrap items-center gap-2.5 sm:flex sm:gap-4">
                        <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="rounded-xl bg-white text-black hover:bg-white/90 sm:h-11 sm:px-6 sm:text-sm"
                        >
                            <a
                                href="#katalog"
                                className="inline-flex items-center gap-1.5"
                            >
                                Jelajahi katalog
                            </a>
                        </Button>

                        {whatsappHref && (
                            <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white sm:h-11 sm:px-6 sm:text-sm"
                            >
                                <a
                                    href={whatsappHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2"
                                >
                                    <img
                                        src="/images/ikon-whatsapp.png"
                                        alt="WhatsApp"
                                        className="size-4 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <span>Hubungi Kami</span>
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
