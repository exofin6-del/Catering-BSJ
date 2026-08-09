import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CustomerBusiness } from '../types/customer-storefront-types';
import {
    customerBusinessCoordinate,
    customerGoogleMapsDirectionsUrl,
    customerGoogleMapsEmbedUrl,
} from '../utils/customer-location';

export function CustomerLocation({ business }: { business: CustomerBusiness }) {
    const coordinate = customerBusinessCoordinate(business);

    return (
        <section id="lokasi" className="scroll-mt-20 pt-4">
            <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12 lg:px-8">
                <div className="grid gap-6">
                    <div className="grid gap-3">
                        <div className="grid gap-2">
                            <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                                Lokasi catering
                            </p>
                            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Temukan Kami
                            </h2>
                            <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
                                Lihat titik lokasi operasional kami dan gunakan
                                Google Maps untuk mendapatkan rute terbaik dari
                                lokasi Anda.
                            </p>
                        </div>
                    </div>

                    {coordinate ? (
                        <div>
                            <Button asChild className="rounded-full px-5">
                                <a
                                    href={customerGoogleMapsDirectionsUrl(
                                        coordinate,
                                    )}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <MapPin className="size-4" />
                                    Buka di Google Maps
                                </a>
                            </Button>
                        </div>
                    ) : null}
                </div>

                <div className="rounded-3xl border border-border/70 bg-muted/30 shadow-sm">
                    {coordinate ? (
                        <iframe
                            title={`Lokasi ${business.name} di Google Maps`}
                            src={customerGoogleMapsEmbedUrl(coordinate)}
                            className="aspect-4/3 w-full rounded-md border-0 sm:aspect-video lg:aspect-16/10"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            allowFullScreen
                        />
                    ) : (
                        <div className="grid aspect-4/3 place-items-center p-8 text-center sm:aspect-video lg:aspect-16/10">
                            <div className="grid max-w-sm justify-items-center gap-3">
                                <span className="grid size-12 place-items-center rounded-2xl bg-card text-muted-foreground shadow-sm">
                                    <MapPin className="size-5" />
                                </span>
                                <div className="grid gap-1">
                                    <p className="font-semibold">
                                        Lokasi belum tersedia
                                    </p>
                                    <p className="text-sm leading-6 text-muted-foreground">
                                        Titik lokasi catering belum diatur pada
                                        pengaturan bisnis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
