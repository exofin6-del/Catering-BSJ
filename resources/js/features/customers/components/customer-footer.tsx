import { Link } from '@inertiajs/react';
import { ChefHat, Phone, UtensilsCrossed } from 'lucide-react';
import BsjLogoIcon from '@/components/shared/brand/bsj-logo-icon';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { customerWhatsAppUrl } from '@/features/customers/utils/customer-whatsapp';
import { home } from '@/routes';
import { info, menuCatalog, packageCatalog } from '@/routes/customerV2';

type CustomerFooterProps = {
    business: CustomerBusiness;
};

const services = [
    {
        description: 'Menu lengkap untuk berbagai selera dan kebutuhan acara.',
        icon: UtensilsCrossed,
        title: 'Menu Satuan',
    },
    {
        description: 'Paket hemat dengan pilihan hidangan yang sudah dikurasi.',
        icon: ChefHat,
        title: 'Paket Catering',
    },
];

export function CustomerFooter({ business }: CustomerFooterProps) {
    const whatsappHref = customerWhatsAppUrl(
        business.whatsapp_number,
        `Halo ${business.name}, saya ingin bertanya tentang layanan catering.`,
    );

    const navLinks = [
        { href: home(), label: 'Beranda' },
        { href: menuCatalog(), label: 'Menu' },
        { href: packageCatalog(), label: 'Paket' },
        { href: info(), label: 'Tentang Kami' },
    ];

    const year = new Date().getFullYear();

    return (
        <footer className="relative mt-16 overflow-hidden bg-primary text-primary-foreground sm:mt-24">
            {/* Vignette supaya bagian bawah lebih gelap & fokus tetap di konten */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `
            radial-gradient(
                90% 65% at 50% 0%,
                color-mix(in oklab, var(--primary) 18%, transparent) 0%,
                transparent 58%
            ),
            linear-gradient(
                to bottom,
                transparent 0%,
                color-mix(in oklab, var(--primary) 8%, transparent) 42%,
                color-mix(in oklab, var(--primary) 72%, black) 100%
            )
        `,
                }}
                aria-hidden="true"
            />

            {/* Main footer grid */}
            <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.8fr_0.8fr_0.8fr_1fr] lg:gap-10 xl:gap-16">
                    {/* Brand & description */}
                    <div className="flex flex-col gap-6">
                        <Link
                            href={home()}
                            className="group inline-flex items-center gap-2"
                        >
                            <span className="grid size-13 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 text-primary-foreground ring-1 ring-primary-foreground/20 transition-colors group-hover:bg-primary-foreground/20">
                                <BsjLogoIcon className="size-12" />
                            </span>
                            <span className="grid min-w-0 text-left">
                                <span className="truncate text-[15px] leading-none font-bold tracking-tight text-primary-foreground">
                                    {business.name}
                                </span>
                                <span className="mt-1 truncate text-[10px] leading-none font-medium tracking-[0.12em] text-primary-foreground/60 uppercase">
                                    Catering &amp; Prasmanan
                                </span>
                            </span>
                        </Link>

                        <p className="max-w-sm text-sm leading-7 text-primary-foreground/70">
                            {business.description ||
                                'Menyediakan hidangan catering untuk berbagai kebutuhan acara dengan menu pilihan yang praktis, lezat, dan terpercaya.'}
                        </p>
                    </div>

                    {/* Navigasi */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[10px] font-semibold tracking-[0.14em] text-primary-foreground/50 uppercase">
                            Navigasi
                        </h3>
                        <nav className="flex flex-col gap-2.5">
                            {navLinks.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="group inline-flex items-center gap-1.5 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Layanan */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[10px] font-semibold tracking-[0.14em] text-primary-foreground/50 uppercase">
                            Layanan
                        </h3>
                        <div className="flex flex-col gap-4">
                            {services.map(
                                ({ description, icon: Icon, title }) => (
                                    <div
                                        key={title}
                                        className="flex items-start gap-3"
                                    >
                                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                                            <Icon className="size-3.5" />
                                        </span>
                                        <div className="grid gap-0.5">
                                            <p className="text-sm font-medium text-primary-foreground/90">
                                                {title}
                                            </p>
                                            <p className="text-xs leading-5 text-primary-foreground/60">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </div>

                    {/* Kontak */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-[10px] font-semibold tracking-[0.14em] text-primary-foreground/50 uppercase">
                            Kontak Kami
                        </h3>
                        <div className="flex flex-col gap-3">
                            {business.whatsapp_number && (
                                <a
                                    href={whatsappHref ?? '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="group inline-flex items-center gap-3 text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                                >
                                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 text-primary-foreground transition-colors group-hover:bg-primary-foreground/25">
                                        <Phone className="size-3.5" />
                                    </span>

                                    <span>{business.whatsapp_number}</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-primary-foreground/15">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                    <p className="text-xs text-primary-foreground/50">
                        © {year}{' '}
                        <span className="font-medium text-primary-foreground/70">
                            {business.name}
                        </span>
                        . Seluruh hak cipta dilindungi.
                    </p>
                    <p className="text-xs text-primary-foreground/50">
                        Catering &amp; Prasmanan
                    </p>
                </div>
            </div>
        </footer>
    );
}
