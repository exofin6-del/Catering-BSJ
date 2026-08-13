import { ChevronLeft, MapPin, MapPinned, RotateCcw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogMedia,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import type { CustomerBusiness } from '@/features/customers/types/customer-storefront-types';
import { customerWhatsAppUrl } from '@/features/customers/utils/customer-whatsapp';
import { cn } from '@/lib/utils';

import { distanceMetersBetween } from './distance';
import { MapV2LocationMap } from './location-map';
import {
    coordinateFromValues,
    formatCoordinate,
    formatDistance,
    isLocationAccurateEnough,
    reverseGeocodeCoordinate,
    SurakartaCoordinate,
} from './location-utils';
import type { Coordinate } from './location-utils';
import { getNearbyLocations } from './nearby-service';
import {
    displayPlaceArea,
    displayPlaceTitle,
    formatAddress,
} from './place-utils';
import { searchPlaces } from './search-service';
import type { PlaceFeature } from './types';

/* ============================================================================
 * GPS cache (module-level)
 * ========================================================================== */

/**
 * Fix GPS terakhir yang sudah cukup akurat, disimpan di luar komponen
 * (module scope) supaya TIDAK hilang saat `LocationCommand` di-unmount
 * lalu di-mount ulang (mis. dialog dipanggil ulang dari komponen/route
 * lain). Tanpa ini, tiap kali komponen remount harus menunggu GPS dari
 * nol lagi walau baru saja dapat titik yang akurat sedetik lalu.
 */
type CachedGpsFix = {
    coord: Coordinate;
    accuracy: number;
    capturedAt: number;
};

let cachedGpsFix: CachedGpsFix | null = null;

const GpsCacheMaxAgeMs = 3 * 60 * 1000; // 3 menit

function readCachedGpsFix(): Coordinate | null {
    if (!cachedGpsFix) {
        return null;
    }

    if (Date.now() - cachedGpsFix.capturedAt > GpsCacheMaxAgeMs) {
        return null;
    }

    return cachedGpsFix.coord;
}

function writeCachedGpsFix(coord: Coordinate, accuracy: number): void {
    cachedGpsFix = { coord, accuracy, capturedAt: Date.now() };
}

async function readGeolocationPermission(): Promise<PermissionState> {
    try {
        if (!navigator.permissions?.query) {
            return 'prompt';
        }

        return (
            await navigator.permissions.query({ name: 'geolocation' })
        ).state;
    } catch {
        // Safari iOS tidak selalu menyediakan Permissions API untuk
        // geolocation. Sumber kebenaran tetap callback Geolocation API.
        return 'prompt';
    }
}

/**
 * Berapa kali maksimal `requestGps` boleh mencoba ulang saat fix yang
 * didapat masih belum cukup akurat (bukan error), sebelum akhirnya
 * pasrah memakai fix terbaik yang sempat didapat.
 */
const MaximumGpsAccuracyRetries = 3;

/* ============================================================================
 * Types
 * ========================================================================== */

export type LocationCommandProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedLatitude?: string | null;
    selectedLongitude?: string | null;
    selectedAddress?: string | null;
    onLocationSelect: (p: {
        latitude: string;
        longitude: string;
        address: string;
    }) => void;
    businessLatitude?: string | number | null;
    businessLongitude?: string | number | null;
    maxOrderKm?: string | number | null;
    business?: CustomerBusiness;
    doneLabel?: string;
    searchPlaceholder?: string;
    surface?: 'storefront';
};

/* ============================================================================
 * LocationCommand
 * ========================================================================== */

export function LocationCommand({
    business,
    open,
    onOpenChange,
    selectedLatitude,
    selectedLongitude,
    selectedAddress,
    onLocationSelect,
    businessLatitude,
    businessLongitude,
    maxOrderKm,

    doneLabel = 'Konfirmasi',
    searchPlaceholder = 'Cari lokasi (nama jalan, gedung, area...)',
    surface,
}: LocationCommandProps) {
    /* ---- State ---- */
    const [draftQuery, setDraftQuery] = useState<string | null>(null);
    const prevQueryRef = useRef<string | null>(null);
    const [results, setResults] = useState<PlaceFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchErr, setSearchErr] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [nearby, setNearby] = useState<PlaceFeature[]>([]);
    const [loadingNearby, setLoadingNearby] = useState(false);
    const [hasNearby, setHasNearby] = useState(false);

    const [gpsCoord, setGpsCoord] = useState<Coordinate | null>(() =>
        readCachedGpsFix(),
    );
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'locating' | 'resolved' | 'unavailable'
    >(() => (readCachedGpsFix() ? 'resolved' : 'idle'));
    const [gpsErr, setGpsErr] = useState<string | null>(null);
    const [gpsRecovery, setGpsRecovery] = useState<'permission' | null>(null);
    const [gpsPriming, setGpsPriming] = useState(false);
    const [permissionState, setPermissionState] = useState<PermissionState>(
        'prompt',
    );

    const [pinCoord, setPinCoord] = useState<Coordinate | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [alertOpen, setAlertOpen] = useState(false);
    const [draftAddress, setDraftAddress] = useState<string>('');

    const doneButtonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Menyimpan koordinat drag paling akhir, dipakai saat
    // onAddressResolved datang dari MapV2LocationMap (satu-satunya
    // sumber reverse-geocode, sudah punya guard anti out-of-order).
    const latestDragCoordRef = useRef<Coordinate | null>(null);

    const gpsRid = useRef(0);
    const gpsRetry = useRef(0);
    const gpsAccuracyRetry = useRef(0);
    const gpsBestFix = useRef<{ coord: Coordinate; accuracy: number } | null>(
        null,
    );
    const gpsLast = useRef(0);
    const gpsErrTmo = useRef<ReturnType<typeof setTimeout> | null>(null);

    /* ---- Derived ---- */
    const [inputValue, setInputValue] = useState('');
    const query = inputValue;

    const selectedCoord = useMemo(
        () => coordinateFromValues(selectedLatitude, selectedLongitude) ?? null,
        [selectedLatitude, selectedLongitude],
    );

    const bizCoord = useMemo(
        () => coordinateFromValues(businessLatitude, businessLongitude) ?? null,
        [businessLatitude, businessLongitude],
    );

    const fallback = useMemo((): { coord: Coordinate; label: string } => {
        if (selectedCoord) {
            return { coord: selectedCoord, label: 'Dari lokasi terpilih' };
        }

        if (bizCoord) {
            return { coord: bizCoord, label: 'Dari lokasi bisnis' };
        }

        return { coord: SurakartaCoordinate, label: 'Surakarta' };
    }, [bizCoord, selectedCoord]);

    // Titik yang BENAR-BENAR mewakili lokasi (bukan tebakan/fallback acak):
    // pin yang digeser manual, GPS yang sudah resolve, atau lokasi yang
    // memang sudah tersimpan sebelumnya. Lokasi bisnis hanya dipakai
    // sebagai fallback SETELAH GPS benar-benar gagal ('unavailable') —
    // bukan sebelum itu — dan Surakarta TIDAK PERNAH dipakai diam-diam
    // sebagai titik tampil; ia hanya dipakai sebagai bias pencarian di
    // `origin` di bawah, yang tidak pernah dirender ke peta/nearby.
    const isLocationPermissionGranted = permissionState === 'granted';
    const resolvedOrigin: Coordinate | null = isLocationPermissionGranted
        ? (pinCoord ??
          gpsCoord ??
          selectedCoord ??
          (gpsStatus === 'unavailable' ? (bizCoord ?? null) : null))
        : null;

    const isOriginReady = resolvedOrigin !== null;

    // `origin` (dengan fallback Surakarta) HANYA dipakai untuk bias query
    // pencarian alamat (tidak pernah ditampilkan sebagai lokasi ke user).
    // Untuk apapun yang dirender ke layar (peta, saran terdekat), selalu
    // pakai `resolvedOrigin` + guard `isOriginReady`.
    const origin: Coordinate = resolvedOrigin ?? fallback.coord;
    const isSearchMode = query.trim() !== '';
    const hasLocation = Boolean(pinCoord ?? selectedCoord);

    //whatsapp
    const href = business
        ? customerWhatsAppUrl(
              business.whatsapp_number,
              `Halo ${business.name}, saya ingin bertanya tentang layanan catering.`,
          )
        : undefined;

    /* ---- GPS ---- */
    const requestGps = useCallback((isActive?: () => boolean) => {
        gpsRid.current += 1;
        const rid = gpsRid.current;
        const active = () =>
            gpsRid.current === rid && (!isActive || isActive());

        if (gpsErrTmo.current) {
            clearTimeout(gpsErrTmo.current);
            gpsErrTmo.current = null;
        }

        gpsAccuracyRetry.current = 0;
        gpsBestFix.current = null;
        setGpsErr(null);
        setGpsRecovery(null);
        setGpsStatus('locating');
        setGpsPriming(true);

        const start = (forceFresh = false) => {
            const t0 = performance.now();
            const done = (cb: () => void, err = false) => {
                const ms = Math.max(
                    (err ? 2000 : 650) - (performance.now() - t0),
                    0,
                );

                if (err) {
                    gpsErrTmo.current = setTimeout(cb, ms);
                } else {
                    window.setTimeout(cb, ms);
                }
            };

            if (!('geolocation' in navigator)) {
                done(() => {
                    setGpsCoord(null);
                    setGpsErr('Lokasi tidak didukung.');
                    setGpsStatus('unavailable');
                    setGpsPriming(false);
                }, true);

                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (!active()) {
                        return;
                    }

                    if (gpsErrTmo.current) {
                        clearTimeout(gpsErrTmo.current);
                        gpsErrTmo.current = null;
                    }

                    const c: Coordinate = [
                        pos.coords.latitude,
                        pos.coords.longitude,
                    ];
                    const accuracy = pos.coords.accuracy;

                    // Simpan fix terbaik sejauh ini sebagai fallback kalau
                    // jatah percobaan akurasi habis sebelum dapat yang
                    // benar-benar akurat.
                    if (
                        !gpsBestFix.current ||
                        accuracy < gpsBestFix.current.accuracy
                    ) {
                        gpsBestFix.current = { coord: c, accuracy };
                    }

                    const accurateEnough = isLocationAccurateEnough(pos);

                    // Belum cukup akurat (mis. masih fix dari WiFi/menara
                    // seluler sebelum GPS satelit "lock") — jangan langsung
                    // dipakai buat peta & saran terdekat. Coba lagi selagi
                    // masih ada jatah, biar hasilnya tidak meleset.
                    if (
                        !accurateEnough &&
                        gpsAccuracyRetry.current < MaximumGpsAccuracyRetries
                    ) {
                        gpsAccuracyRetry.current += 1;
                        window.setTimeout(() => {
                            if (active()) {
                                start(true);
                            }
                        }, 700);

                        return;
                    }

                    done(() => {
                        gpsLast.current = Date.now();
                        setPermissionState('granted');

                        const finalFix = accurateEnough
                            ? { coord: c, accuracy }
                            : (gpsBestFix.current ?? { coord: c, accuracy });

                        setGpsCoord(finalFix.coord);
                        setPinCoord(finalFix.coord);
                        setDraftAddress('Memuat alamat...');
                        writeCachedGpsFix(finalFix.coord, finalFix.accuracy);
                        setGpsErr(
                            accurateEnough
                                ? null
                                : `Lokasi kurang akurat (±${Math.round(finalFix.accuracy)}m). Geser pin bila perlu.`,
                        );
                        setGpsRecovery(null);
                        setGpsStatus('resolved');
                        setGpsPriming(false);
                        gpsRetry.current = 0;
                        gpsAccuracyRetry.current = 0;

                        const [gpsLat, gpsLng] = finalFix.coord;
                        void reverseGeocodeCoordinate(finalFix.coord).then(
                            (addr) => {
                                setDraftAddress(
                                    addr ||
                                        `${formatCoordinate(gpsLat)}, ${formatCoordinate(gpsLng)}`,
                                );
                            },
                        );
                    });
                },
                (err) => {
                    done(() => {
                        if (Date.now() - gpsLast.current < 5000) {
                            return;
                        }

                        readGeolocationPermission().then((state) => {
                            if (!active()) {
                                return;
                            }

                            setPermissionState(state);

                            if (
                                err.code ===
                                    GeolocationPositionError.PERMISSION_DENIED ||
                                state === 'denied'
                            ) {
                                setGpsCoord(null);
                                setGpsErr(
                                    'Izinkan lokasi untuk menampilkan saran terdekat.',
                                );
                                setGpsRecovery('permission');
                                setGpsStatus('unavailable');
                                setGpsPriming(false);

                                return;
                            }

                            if (gpsRetry.current >= 2) {
                                setGpsCoord(null);
                                setGpsErr('Gagal mengambil lokasi.');
                                setGpsStatus('unavailable');
                                setGpsPriming(false);

                                return;
                            }

                            gpsRetry.current += 1;
                            setGpsStatus('locating');
                            setGpsPriming(true);
                            window.setTimeout(() => {
                                if (active()) {
                                    start();
                                }
                            }, 1000);
                        });
                    }, true);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: forceFresh ? 0 : 30000,
                    timeout: 15000,
                },
            );
        };
        start();
    }, []);

    const handleUseCurrentLocation = useCallback(() => {
        // Harus dipanggil langsung dari aksi pengguna. Safari iOS dapat
        // menolak menampilkan prompt jika geolocation diminta dari effect
        // atau timer, dan cache tidak boleh melewati permintaan izin ini.

        // Invalidasi requestGps yang mungkin masih berjalan di background
        // supaya tidak saling menimpa dengan hasil manual ini.
        gpsRid.current += 1;
        gpsAccuracyRetry.current = 0;
        gpsBestFix.current = null;

        setGpsStatus('locating');
        setGpsErr(null);
        setGpsRecovery(null);
        setGpsPriming(true);

        if (!('geolocation' in navigator)) {
            setGpsCoord(null);
            setGpsErr('Lokasi tidak didukung.');
            setGpsStatus('unavailable');
            setGpsPriming(false);

            return;
        }

        const attempt = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setPermissionState('granted');
                    const c: Coordinate = [
                        pos.coords.latitude,
                        pos.coords.longitude,
                    ];
                    const accuracy = pos.coords.accuracy;

                    if (
                        !gpsBestFix.current ||
                        accuracy < gpsBestFix.current.accuracy
                    ) {
                        gpsBestFix.current = { coord: c, accuracy };
                    }

                    const accurateEnough = isLocationAccurateEnough(pos);

                    // Sama seperti requestGps: jangan langsung dipakai kalau
                    // masih belum akurat, coba lagi selagi ada jatah.
                    if (
                        !accurateEnough &&
                        gpsAccuracyRetry.current < MaximumGpsAccuracyRetries
                    ) {
                        gpsAccuracyRetry.current += 1;
                        window.setTimeout(attempt, 700);

                        return;
                    }

                    const finalFix = accurateEnough
                        ? { coord: c, accuracy }
                        : (gpsBestFix.current ?? { coord: c, accuracy });

                    setGpsCoord(finalFix.coord);
                    setPinCoord(finalFix.coord);
                    setGpsStatus('resolved');
                    setGpsErr(
                        accurateEnough
                            ? null
                            : `Lokasi kurang akurat (±${Math.round(finalFix.accuracy)}m). Geser pin bila perlu.`,
                    );
                    setGpsRecovery(null);
                    setGpsPriming(false);
                    writeCachedGpsFix(finalFix.coord, finalFix.accuracy);

                    const [lat, lng] = finalFix.coord;

                    setDraftAddress('Memuat alamat...');

                    void reverseGeocodeCoordinate(finalFix.coord).then(
                        (addr) => {
                            setDraftAddress(
                                addr ||
                                    `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`,
                            );
                        },
                    );
                },

                (err) => {
                    // Tampilkan error yang lebih jelas untuk permission denied
                    if (
                        err.code === GeolocationPositionError.PERMISSION_DENIED
                    ) {
                        setPermissionState('denied');
                        setGpsCoord(null);
                        setGpsErr(
                            'Izin lokasi ditolak. Izinkan akses lokasi di browser untuk menggunakan fitur ini.',
                        );
                        setGpsRecovery('permission');
                        setGpsStatus('unavailable');
                        setGpsPriming(false);
                    } else {
                        setGpsCoord(null);
                        setGpsErr(
                            'Gagal mengambil lokasi saat ini. Pastikan izin lokasi aktif.',
                        );
                        setGpsStatus('unavailable');
                        setGpsPriming(false);
                    }
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        };

        attempt();
    }, [setDraftAddress]);

    /* ---- Effects ---- */

    // Jangan meminta izin baru dari effect. Safari/iOS lebih konsisten jika
    // `getCurrentPosition()` dipanggil langsung dari aksi tap pengguna.
    // Izin yang sudah granted tetap boleh dipakai otomatis saat drawer dibuka.
    useEffect(() => {
        if (!open) {
            return;
        }

        let isActive = true;
        const requestId = gpsRid.current;

        if (gpsCoord) {
            return;
        }

        void readGeolocationPermission().then((permission) => {
            if (!isActive || gpsRid.current !== requestId) {
                return;
            }

            setPermissionState(permission);

            if (gpsCoord) {
                return;
            }

            if (permission === 'granted') {
                requestGps(() => isActive);

                return;
            }

            setGpsStatus('idle');
            setGpsPriming(false);
        });

        return () => {
            isActive = false;
        };
    }, [gpsCoord, open, requestGps]);

    // Reset saat tutup
    useEffect(() => {
        if (open) {
            return;
        }

        const t = window.setTimeout(() => {
            setPinCoord(null);
            setDraftAddress('');
            gpsRid.current += 1;
            gpsRetry.current = 0;
            gpsAccuracyRetry.current = 0;
            gpsBestFix.current = null;
            setGpsErr(null);
            setGpsRecovery(null);
            setIsSearchActive(false);

            // Kalau ada fix GPS yang sudah tersimpan (cache), jangan
            // dianggap "priming" lagi — biar saat dibuka lagi langsung
            // tampil tanpa loading state yang tidak perlu.
            if (!gpsCoord) {
                setGpsPriming(false);
                setGpsStatus('idle');
            } else {
                setGpsPriming(false);
            }
        }, 0);

        return () => window.clearTimeout(t);
    }, [gpsCoord, open]);

    // Nearby
    useEffect(() => {
        let a = true;
        const t = window.setTimeout(() => {
            if (!a) {
                return;
            }

            // Jangan fetch (apalagi pakai fallback Surakarta/lokasi bisnis)
            // selama titik lokasi asli belum benar-benar siap — tunggu sampai
            // isOriginReady true supaya saran terdekat selalu relevan dengan
            // posisi sebenarnya, bukan lokasi acak sambil menunggu GPS.
            if (!open || isSearchMode || !isOriginReady || !resolvedOrigin) {
                setNearby([]);
                setHasNearby(false);

                return;
            }

            setLoadingNearby(true);
            setHasNearby(false);
            getNearbyLocations(
                {
                    latitude: resolvedOrigin[0],
                    longitude: resolvedOrigin[1],
                },
                { radius: 1500, limit: 5 },
            )
                .then((res) => {
                    if (!a) {
                        return;
                    }

                    setNearby(
                        res.map((r) => ({
                            type: 'Feature' as const,
                            geometry: {
                                type: 'Point' as const,
                                coordinates: [
                                    r.coordinate.longitude,
                                    r.coordinate.latitude,
                                ] as [number, number],
                            },
                            properties: {
                                id: r.id,
                                name: r.name,
                                formatted: r.address,
                                street: r.street,
                                housenumber: r.housenumber,
                                suburb: r.suburb,
                                district: r.district,
                                city: r.city,
                                state: r.state,
                                postcode: r.postcode,
                                category: r.category,
                                distanceMeters: r.distance,
                            },
                        })),
                    );
                })
                .catch((e) => {
                    if (e instanceof Error && e.name === 'AbortError') {
                        return;
                    }

                    if (!a) {
                        return;
                    }

                    setNearby([]);
                })
                .finally(() => {
                    if (!a) {
                        return;
                    }

                    setHasNearby(true);
                    setLoadingNearby(false);
                });
        }, 0);

        return () => {
            a = false;
            window.clearTimeout(t);
        };
    }, [isOriginReady, isSearchMode, open, resolvedOrigin]);

    // Search
    useEffect(() => {
        const q = query.trim();

        if (
            !open ||
            draftQuery === null ||
            q === '' ||
            q === prevQueryRef.current
        ) {
            return;
        }

        prevQueryRef.current = q;

        const ac = new AbortController();
        const t = window.setTimeout(() => {
            setIsSearching(true);
            setSearchErr(null);
            setHasSearched(true);
            searchPlaces(q, {
                origin: { latitude: origin[0], longitude: origin[1] },
                signal: ac.signal,
            })
                .then((r) => setResults(r))
                .catch((e) => {
                    if (e instanceof Error && e.name === 'AbortError') {
                        return;
                    }

                    setResults([]);
                    setSearchErr('Gagal mencari.');
                })
                .finally(() => setIsSearching(false));
        }, 300);

        return () => {
            window.clearTimeout(t);
            ac.abort();
        };
    }, [draftQuery, open, origin, query]);

    /* ---- Handlers ---- */
    const handleOpen = useCallback(
        (next: boolean) => {
            if (!next) {
                setDraftQuery(null);
                prevQueryRef.current = null;
                setResults([]);
                setIsSearching(false);
                setSearchErr(null);
                setHasSearched(false);
                setNearby([]);
                setLoadingNearby(false);
                setHasNearby(false);
                setPinCoord(null);
                setDraftAddress('');
                gpsRid.current += 1;
                gpsRetry.current = 0;
                gpsAccuracyRetry.current = 0;
                gpsBestFix.current = null;
                setGpsErr(null);
                setGpsRecovery(null);
                setIsSearchActive(false);

                if (!gpsCoord) {
                    setGpsPriming(false);
                    setGpsStatus('idle');
                } else {
                    setGpsPriming(false);
                }
            }

            onOpenChange(next);
        },
        [gpsCoord, onOpenChange],
    );

    const handleDone = useCallback(() => {
        // Gunakan pinCoord (draft) jika ada, fallback ke selectedCoord
        const coordToCheck = pinCoord ?? selectedCoord;

        if (
            surface === 'storefront' &&
            coordToCheck &&
            bizCoord &&
            maxOrderKm
        ) {
            const distanceM = distanceMetersBetween(
                { latitude: coordToCheck[0], longitude: coordToCheck[1] },
                { latitude: bizCoord[0], longitude: bizCoord[1] },
            );
            const distanceKm = distanceM / 1000;

            if (distanceKm > Number(maxOrderKm)) {
                setAlertOpen(true);

                return;
            }
        }

        // Update form dengan lokasi draft (pinCoord) jika ada
        if (pinCoord) {
            onLocationSelect({
                latitude: formatCoordinate(pinCoord[0]),
                longitude: formatCoordinate(pinCoord[1]),
                address:
                    draftAddress ||
                    `${formatCoordinate(pinCoord[0])}, ${formatCoordinate(pinCoord[1])}`,
            });
        }

        handleOpen(false);
    }, [
        surface,
        pinCoord,
        draftAddress,
        selectedCoord,
        bizCoord,
        maxOrderKm,
        onLocationSelect,
        handleOpen,
    ]);

    const handleQueryChange = useCallback((v: string) => {
        setInputValue(v);
        setDraftQuery(v);
        prevQueryRef.current = null;
    }, []);
    const handleClear = useCallback(() => {
        setInputValue('');
        setDraftQuery('');
        prevQueryRef.current = null;
        setResults([]);
        setSearchErr(null);
        setHasSearched(false);
        setIsSearching(false);
    }, []);

    // Drawer ini modal (focus-trap aktif): kalau kita cuma blur() input,
    // fokus sempat lepas ke document.body di luar trap, dan trap-nya
    // langsung menarik fokus itu balik ke elemen focusable PERTAMA di
    // dalam drawer — yang notabene ya input itu sendiri. Makanya kalau
    // cuma blur(), kelihatannya seperti "auto-focus sendiri terus".
    // Solusinya: pindahkan fokus ke elemen focusable lain yang memang
    // ada di dalam drawer (tombol Done), bukan blur ke luar trap.
    // requestAnimationFrame menunggu footer (yang cuma render saat
    // !isSearchActive) selesai ter-mount dulu.
    const releaseInputFocus = useCallback(() => {
        requestAnimationFrame(() => {
            if (doneButtonRef.current) {
                doneButtonRef.current.focus();
            } else {
                inputRef.current?.blur();
            }
        });
    }, []);

    const handleExitSearch = useCallback(() => {
        setIsSearchActive(false);
        handleClear();
        releaseInputFocus();
    }, [handleClear, releaseInputFocus]);

    const handleSelect = useCallback(
        async (f: PlaceFeature, skipSearchMode = false) => {
            const [lng, lat] = f.geometry.coordinates;
            const addr = formatAddress(f);
            setPinCoord([lat, lng]);

            // Jika place sudah punya alamat bermakna (berisi nama tempat),
            // gunakan langsung — jangan override dengan reverse geocode
            // yang bisa kehilangan nama tempat khusus seperti "Kantor
            // Kelurahan Gedongan". Reverse geocode hanya sebagai fallback.
            let finalAddr = addr;

            if (!finalAddr || finalAddr.trim() === '') {
                try {
                    const reverseAddr = await reverseGeocodeCoordinate([
                        lat,
                        lng,
                    ]);

                    if (reverseAddr) {
                        finalAddr = reverseAddr;
                    }
                } catch {
                    // keep original addr when reverse geocode fails
                }
            }

            setDraftAddress(finalAddr);

            if (!skipSearchMode) {
                setDraftQuery(finalAddr);
                prevQueryRef.current = finalAddr;
                setIsSearchActive(false);
                releaseInputFocus();
            }
        },
        [setDraftAddress, setIsSearchActive, releaseInputFocus],
    );

    /* ---- UI ---- */
    const noResults =
        hasSearched && !isSearching && !searchErr && results.length === 0;
    const showMap =
        isLocationPermissionGranted &&
        !isSearchActive &&
        (!isSearchMode || hasLocation);
    // Tampilkan skeleton peta selama titik lokasi asli belum siap
    // (`isOriginReady` false) — termasuk saat GPS masih locating maupun
    // saat sudah gagal tapi belum ada fallback nyata (pin/selected/biz).
    // Peta tidak pernah dirender memakai fallback Surakarta.
    const showSkeleton = !isOriginReady;
    const nearbyLoading =
        (!isOriginReady && gpsStatus !== 'unavailable') ||
        (isOriginReady && (!hasNearby || loadingNearby));

    const labelOrigin = useMemo(() => {
        if (gpsStatus === 'locating') {
            return 'Mengambil lokasi...';
        }

        if (pinCoord) {
            return 'Dari titik pin';
        }

        if (gpsCoord) {
            return 'Dari lokasi saat ini';
        }

        return fallback.label;
    }, [gpsCoord, gpsStatus, fallback.label, pinCoord]);

    const labelNearby = useMemo(() => {
        if (gpsStatus === 'locating') {
            return 'Mengambil lokasi...';
        }

        if (pinCoord) {
            return 'Titik pin di peta';
        }

        if (gpsCoord) {
            return 'Dari lokasi saat ini';
        }

        return 'Lokasi saat ini belum aktif';
    }, [gpsCoord, gpsStatus, pinCoord]);

    const selText = useMemo(() => {
        if (draftAddress?.trim()) {
            return draftAddress;
        }

        if (pinCoord) {
            return `${formatCoordinate(pinCoord[0])}, ${formatCoordinate(pinCoord[1])}`;
        }

        if (selectedAddress?.trim()) {
            return selectedAddress;
        }

        if (selectedCoord) {
            return `${formatCoordinate(selectedCoord[0])}, ${formatCoordinate(selectedCoord[1])}`;
        }

        return 'Lokasi belum dipilih';
    }, [draftAddress, pinCoord, selectedAddress, selectedCoord]);

    const items = isSearchMode ? results : nearby;
    const isLoading = isSearchMode ? isSearching : nearbyLoading;
    const emptyMsg = isSearchMode
        ? (searchErr ?? (noResults ? 'Lokasi tidak ditemukan.' : null))
        : gpsErr;
    const panelTitle = isSearchMode ? 'Hasil Pencarian' : 'Saran Terdekat';
    const panelOrigin = isSearchMode ? labelOrigin : labelNearby;

    return (
        <>
            <Drawer
                open={open}
                onOpenChange={handleOpen}
                swipeDirection="right"
            >
                <DrawerContent className="m-0 h-[100svh] max-h-none w-full max-w-none rounded-none border-0 bg-card text-card-foreground shadow-xl [--drawer-inset:0px] max-sm:right-0 max-sm:left-auto max-sm:h-[100svh] max-sm:max-h-none max-sm:w-screen! max-sm:max-w-none! max-sm:rounded-none! md:m-2 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)] md:w-[28rem] md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:shadow-2xl md:[--drawer-inset:--spacing(2)]">
                    <Command
                        shouldFilter={false}
                        className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border-none bg-transparent p-0 text-slate-700 shadow-2xl outline-none sm:rounded-xl dark:text-slate-300"
                    >
                        {/* Header */}
                        <div className="relative z-[1002] flex shrink-0 items-center gap-1 border-b px-3 py-1.5 sm:py-2">
                            {isSearchActive ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    aria-label="Keluar dari pencarian"
                                    onClick={handleExitSearch}
                                >
                                    <ChevronLeft className="size-5 text-zinc-500" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0 sm:hidden"
                                    aria-label="Kembali"
                                    onClick={() => handleOpen(false)}
                                >
                                    <ChevronLeft className="size-5 text-zinc-500" />
                                </Button>
                            )}
                            <div className="relative min-w-0 flex-1">
                                <CommandInput
                                    ref={inputRef}
                                    autoFocus={false}
                                    placeholder={searchPlaceholder}
                                    wrapperClassName="p-0"
                                    className="h-10 min-w-0 border-none bg-transparent pr-9 text-[15px] shadow-none focus-visible:ring-0"
                                    inputGroupClassName="h-10! rounded-xl! border-primary/15 bg-primary/[0.03] text-foreground shadow-none! placeholder:text-muted-foreground/50 focus-within:border-primary/30 focus-within:ring-primary/20 **:[data-slot=input-group-addon]:pl-3.5! **:[data-slot=input-group-addon]:pr-2! **:[data-slot=input-group-addon]:text-primary [&_svg]:opacity-100"
                                    value={inputValue}
                                    onValueChange={handleQueryChange}
                                    onFocus={() => setIsSearchActive(true)}
                                />
                                {query.trim() !== '' && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-xs"
                                        className="absolute top-1/2 right-2 z-10 size-6 -translate-y-1/2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                                        aria-label="Bersihkan"
                                        onClick={handleClear}
                                    >
                                        <X className="size-3.5" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
                            {showMap && (
                                <div className="border-b border-border/30 p-2">
                                    {showSkeleton ? (
                                        <div className="relative h-56 min-h-48 overflow-hidden bg-muted sm:h-64">
                                            <Skeleton className="h-full w-full rounded-none" />
                                            {gpsStatus === 'idle' ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                                                    <MapPin className="size-5 text-muted-foreground" />
                                                    <span className="max-w-60 text-sm text-muted-foreground">
                                                        Izinkan lokasi untuk
                                                        menampilkan lokasi Anda
                                                        di peta.
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        className="h-9 rounded-lg px-3 text-xs"
                                                        onClick={
                                                            handleUseCurrentLocation
                                                        }
                                                    >
                                                        Gunakan lokasi saat ini
                                                    </Button>
                                                </div>
                                            ) : gpsStatus === 'unavailable' ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                                                    <MapPin className="size-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {gpsErr ??
                                                            'Gagal mengambil lokasi saat ini.'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <MapPin className="size-4 animate-pulse text-muted-foreground" />
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        Menyiapkan titik
                                                        lokasi...
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <MapV2LocationMap
                                            selectedLatitude={
                                                pinCoord
                                                    ? formatCoordinate(
                                                          pinCoord[0],
                                                      )
                                                    : selectedLatitude
                                            }
                                            selectedLongitude={
                                                pinCoord
                                                    ? formatCoordinate(
                                                          pinCoord[1],
                                                      )
                                                    : selectedLongitude
                                            }
                                            selectedAddress={
                                                draftAddress || selectedAddress
                                            }
                                            currentLocation={gpsCoord}
                                            currentLocationLoading={
                                                gpsStatus === 'locating'
                                            }
                                            businessLatitude={
                                                businessLatitude !== null &&
                                                businessLatitude !== undefined
                                                    ? String(businessLatitude)
                                                    : null
                                            }
                                            businessLongitude={
                                                businessLongitude !== null &&
                                                businessLongitude !== undefined
                                                    ? String(businessLongitude)
                                                    : null
                                            }
                                            onCoordinateChange={(coords) => {
                                                latestDragCoordRef.current =
                                                    coords;
                                                setPinCoord(coords);
                                                setDraftAddress(
                                                    'Memuat alamat...',
                                                );
                                            }}
                                            onAddressResolved={(addr) => {
                                                const coords =
                                                    latestDragCoordRef.current;

                                                if (!coords) {
                                                    return;
                                                }

                                                setDraftAddress(
                                                    addr ||
                                                        `${formatCoordinate(coords[0])}, ${formatCoordinate(coords[1])}`,
                                                );
                                            }}
                                            onLocationFound={(
                                                coords,
                                                accuracy,
                                            ) => {
                                                setPermissionState('granted');
                                                setGpsCoord(coords);
                                                setPinCoord(coords);
                                                setGpsStatus('resolved');
                                                setGpsRecovery(null);
                                                setGpsPriming(false);
                                                writeCachedGpsFix(
                                                    coords,
                                                    accuracy,
                                                );
                                            }}
                                            onLocateCurrentLocation={
                                                handleUseCurrentLocation
                                            }
                                            variant="compact"
                                            mapClassName="h-56 min-h-48 sm:h-64"
                                        />
                                    )}
                                    <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                        <MapPin
                                            className={cn(
                                                'size-4 shrink-0',
                                                hasLocation
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground/45',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'truncate font-medium',
                                                hasLocation
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground/70',
                                            )}
                                        >
                                            {selText}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {!isSearchMode && !isLocationPermissionGranted && (
                                <div className="flex flex-col items-center gap-3 border-b border-border/30 px-6 py-8 text-center">
                                    {gpsStatus === 'locating' ? (
                                        <MapPin className="size-5 animate-pulse text-muted-foreground" />
                                    ) : (
                                        <MapPin className="size-5 text-muted-foreground" />
                                    )}
                                    <p className="max-w-xs text-sm text-muted-foreground">
                                        {gpsStatus === 'locating'
                                            ? 'Menunggu izin lokasi dari browser...'
                                            : 'Izinkan akses lokasi untuk menampilkan peta dan saran lokasi terdekat.'}
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        className="h-9 rounded-lg px-3 text-xs"
                                        disabled={gpsStatus === 'locating'}
                                        onClick={handleUseCurrentLocation}
                                    >
                                        {gpsStatus === 'locating'
                                            ? 'Meminta izin...'
                                            : permissionState === 'denied'
                                              ? 'Coba izinkan lokasi'
                                              : 'Izinkan lokasi'}
                                    </Button>
                                </div>
                            )}

                            {/* Panel */}
                            <div
                                className={cn(
                                    'flex min-w-0 shrink-0 flex-col overflow-hidden border-b border-border/30',
                                    !isSearchMode &&
                                        !isLocationPermissionGranted &&
                                        'hidden',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2 px-4 py-2">
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground/40 uppercase">
                                        {panelTitle}
                                    </span>
                                    <span className="min-w-0 shrink truncate text-right text-[11px] font-medium text-muted-foreground/35">
                                        {panelOrigin}
                                    </span>
                                </div>
                                <div className="min-h-0">
                                    {isLoading ? (
                                        <div className="grid overflow-hidden">
                                            {['s1', 's2', 's3', 's4', 's5'].map(
                                                (k) => (
                                                    <div
                                                        key={k}
                                                        className="flex items-center gap-4 px-4 py-3"
                                                    >
                                                        <div className="flex w-14 shrink-0 flex-col items-center gap-1.5">
                                                            <Skeleton className="size-5 rounded-full" />
                                                            <Skeleton className="h-2.5 w-9 rounded-full" />
                                                        </div>
                                                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                                                            <Skeleton className="h-4 w-1/2 rounded-full" />
                                                            <Skeleton className="h-3 w-3/4 rounded-full" />
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <CommandList className="max-h-none overflow-x-hidden bg-transparent p-0">
                                            {emptyMsg && items.length === 0 && (
                                                <CommandEmpty className="px-4 py-6">
                                                    <div className="mx-auto flex max-w-72 flex-col items-center gap-3 text-center">
                                                        <span className="text-xs text-muted-foreground/55">
                                                            {emptyMsg}
                                                        </span>
                                                        {!isSearchMode &&
                                                            gpsStatus ===
                                                                'unavailable' &&
                                                            !gpsPriming &&
                                                            gpsRecovery && (
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className="h-8 rounded-lg px-3 text-xs"
                                                                    onClick={
                                                                        handleUseCurrentLocation
                                                                    }
                                                                >
                                                                    <RotateCcw className="mr-1 size-3" />
                                                                    Coba lagi
                                                                </Button>
                                                            )}
                                                    </div>
                                                </CommandEmpty>
                                            )}
                                            {!emptyMsg &&
                                                items.length === 0 && (
                                                    <CommandEmpty className="py-6 text-xs text-muted-foreground/50">
                                                        Belum ada lokasi.
                                                    </CommandEmpty>
                                                )}
                                            {(!isSearchMode ||
                                                items.length > 0) && (
                                                <CommandGroup className="bg-transparent p-0 text-slate-700 dark:text-slate-300">
                                                    {items.map((f) => (
                                                        <CommandItem
                                                            key={[
                                                                f.properties.id,
                                                                f.geometry
                                                                    .coordinates[0],
                                                                f.geometry
                                                                    .coordinates[1],
                                                            ].join('-')}
                                                            value={
                                                                f.properties
                                                                    .id ??
                                                                `${f.geometry.coordinates[1]},${f.geometry.coordinates[0]}`
                                                            }
                                                            className="group cursor-pointer rounded-none bg-transparent px-4 py-3 text-slate-700 transition-colors data-selected:bg-transparent data-selected:text-slate-700 dark:text-slate-300 dark:data-selected:text-slate-300 [&>svg:last-child]:hidden"
                                                            onSelect={() =>
                                                                handleSelect(f)
                                                            }
                                                        >
                                                            <div className="grid w-full max-w-full min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3 overflow-hidden">
                                                                <div className="mt-0.5 flex min-w-0 flex-col items-center gap-1.5 text-slate-600 transition-colors dark:text-slate-400">
                                                                    {isSearchMode ? (
                                                                        <MapPin className="size-5 text-slate-400 dark:text-slate-500" />
                                                                    ) : (
                                                                        <MapPinned className="size-5 text-slate-400 dark:text-slate-500" />
                                                                    )}
                                                                    <span className="text-[10px] font-bold tracking-tight text-slate-400 dark:text-slate-500">
                                                                        {formatDistance(
                                                                            distanceMetersBetween(
                                                                                {
                                                                                    latitude:
                                                                                        origin[0],
                                                                                    longitude:
                                                                                        origin[1],
                                                                                },
                                                                                {
                                                                                    latitude:
                                                                                        f
                                                                                            .geometry
                                                                                            .coordinates[1],
                                                                                    longitude:
                                                                                        f
                                                                                            .geometry
                                                                                            .coordinates[0],
                                                                                },
                                                                            ),
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="flex max-w-full min-w-0 flex-col gap-1 overflow-hidden">
                                                                    <span className="block max-w-full truncate text-sm font-semibold tracking-tight text-slate-800 transition-colors dark:text-slate-200">
                                                                        {displayPlaceTitle(
                                                                            f,
                                                                        )}
                                                                    </span>
                                                                    <span className="block max-w-full truncate text-xs leading-snug text-slate-500 transition-colors dark:text-slate-400">
                                                                        {(() => {
                                                                            const a =
                                                                                displayPlaceArea(
                                                                                    f,
                                                                                );
                                                                            const ad =
                                                                                formatAddress(
                                                                                    f,
                                                                                );

                                                                            return a
                                                                                ? `${a} • ${ad}`
                                                                                : ad;
                                                                        })()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        {!isSearchActive && (
                            <div className="relative z-[1002] shrink-0 border-t border-border/30 bg-background px-8 py-4">
                                <Button
                                    ref={doneButtonRef}
                                    type="button"
                                    variant="default"
                                    className="h-11 w-full rounded-xl text-sm font-semibold"
                                    onClick={handleDone}
                                >
                                    {doneLabel}
                                </Button>
                            </div>
                        )}
                    </Command>
                </DrawerContent>
            </Drawer>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent size="sm">
                    <AlertDialogHeader>
                        <AlertDialogMedia className="bg-destructive/10 text-destructive">
                            <MapPin className="size-5" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>
                            Lokasi di Luar Jangkauan
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Mohon maaf, lokasi yang Anda pilih saat ini belum
                            terjangkau oleh layanan kami. Silakan hubungi kami
                            melalui WhatsApp untuk informasi dan detail lebih
                            lanjut.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAlertOpen(false)}>
                            Pilih Lokasi Lain
                        </AlertDialogCancel>

                        {href && (
                            <AlertDialogAction asChild>
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="gap-2"
                                >
                                    <img
                                        src="/images/ikon-whatsapp.png"
                                        alt=""
                                        className="h-4 w-4"
                                    />
                                    WhatsApp
                                </a>
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
