import {
    CalendarCheck2,
    ChefHat,
    ClipboardCheck,
    UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustomerBusiness } from '../types/customer-storefront-types';

const values = [
    {
        description: 'Menu disiapkan untuk menjaga rasa dan kualitas sajian.',
        icon: ChefHat,
        title: 'Dimasak dengan perhatian',
    },
    {
        description: 'Tersedia menu satuan dan paket untuk berbagai acara.',
        icon: UtensilsCrossed,
        title: 'Pilihan yang fleksibel',
    },
    {
        description: 'Detail pesanan dirangkum agar mudah diperiksa kembali.',
        icon: ClipboardCheck,
        title: 'Pemesanan lebih jelas',
    },
    {
        description: 'Jadwal disesuaikan dengan kebutuhan momen Anda.',
        icon: CalendarCheck2,
        title: 'Terencana dan tepat',
    },
] as const;

export function CustomerAbout({ business }: { business: CustomerBusiness }) {
    return (
        <section
            id="tentang"
            className="scroll-mt-20 border-y border-border/60 bg-muted/25 py-16 sm:py-20"
        >
            <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
                <div className="grid gap-6">
                    <div className="grid gap-3">
                        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                            Tentang {business.name}
                        </p>
                        <h2 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                            Sajian yang dipersiapkan untuk setiap momen penting.
                        </h2>
                        <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                            {business.description ??
                                `${business.name} membantu memenuhi kebutuhan konsumsi
                                untuk rapat, acara keluarga, perayaan, dan berbagai
                                kegiatan lainnya. Setiap pilihan dibuat agar proses
                                pemesanan terasa praktis, jelas, dan nyaman.`}
                        </p>
                    </div>

                    <div>
                        <Button asChild className="rounded-full px-5">
                            <a href="#katalog">Jelajahi menu &amp; paket</a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    {values.map(({ description, icon: Icon, title }) => (
                        <article
                            key={title}
                            className="grid gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-sm shadow-black/3"
                        >
                            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <Icon className="size-5" />
                            </span>
                            <div className="grid gap-1.5">
                                <h3 className="font-semibold tracking-tight">
                                    {title}
                                </h3>
                                <p className="text-sm leading-6 text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
