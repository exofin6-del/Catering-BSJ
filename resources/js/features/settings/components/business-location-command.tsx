import { ChevronLeft, LoaderCircle, MapPin, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { distanceMetersBetween } from '@/components/shared/mapV2/distance';
import type { Coordinate } from '@/components/shared/mapV2/location-utils';
import {
    coordinateFromValues,
    formatCoordinate,
    formatDistance,
    isLocationAccurateEnough,
    reverseGeocodeCoordinate,
    SurakartaCoordinate,
} from '@/components/shared/mapV2/location-utils';
import {
    displayPlaceArea,
    displayPlaceTitle,
    formatAddress,
} from '@/components/shared/mapV2/place-utils';
import { searchPlaces } from '@/components/shared/mapV2/search-service';
import type { PlaceFeature } from '@/components/shared/mapV2/types';
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
import { BusinessLocationMap } from '@/features/settings/components/business-location-map';
import { cn } from '@/lib/utils';

/* ============================================================================
 * Types
 * ========================================================================== */

export type BusinessLocationCommandProps = {
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
    /** Radius area layanan (km) untuk lingkaran di peta */
    radiusKm?: number;
    onRadiusChange?: (km: number) => void;
};

/* ============================================================================
 * GPS cache (module-level)
 * ========================================================================== */

/**
 * Fix GPS terakhir yang sudah didapat, disimpan di luar komponen (module
 * scope) supaya TIDAK hilang saat `BusinessLocationCommand` di-unmount lalu
 * di-mount ulang. Tanpa ini, tiap kali komponen remount harus menunggu GPS
 * dari nol lagi walau baru saja dapat titik sedetik lalu.
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

async function readGeolocationPermission(): Promise<PermissionState> {
    if (cachedPermissionState) {
        return cachedPermissionState;
    }

    try {
        const p = await navigator.permissions.query({ name: 'geolocation' });
        cachedPermissionState = p.state;

        // Update cache bila izin berubah (mis. user cabut izin di browser)
        p.addEventListener('change', () => {
            cachedPermissionState = p.state;
        });

        return p.state;
    } catch {
        return 'prompt';
    }
}

function writeCachedGpsFix(coord: Coordinate, accuracy: number): void {
    cachedGpsFix = { coord, accuracy, capturedAt: Date.now() };
}

/**
 * Cache status izin geolocation di module scope supaya tidak perlu
 * query `navigator.permissions` berulang kali.
 */
let cachedPermissionState: PermissionState | null = null;

/**
 * Berapa kali maksimal `requestGps` boleh mencoba ulang saat fix yang
 * didapat masih belum cukup akurat (bukan error), sebelum akhirnya
 * pasrah memakai fix terbaik yang sempat didapat.
 */
const MaximumGpsAccuracyRetries = 3;

/* ============================================================================
 * BusinessLocationCommand
 *
 * Drawer khusus untuk memilih lokasi pusat catering di pengaturan area
 * layanan. Berbeda dari `LocationCommand` (mapV2), komponen ini:
 *   - TIDAK memiliki saran terdekat (nearby suggestions)
 *   - MENAMBAHKAN lingkaran radius area layanan di peta
 *   - Menampilkan info radius di bawah peta
 *   - Hanya menampilkan hasil pencarian alamat (search results)
 * ========================================================================== */

export function BusinessLocationCommand({
    open,
    onOpenChange,
    selectedLatitude,
    selectedLongitude,
    selectedAddress,
    onLocationSelect,
    radiusKm = 1,
    onRadiusChange,
}: BusinessLocationCommandProps) {
    /* ---- State ---- */
    const [draftQuery, setDraftQuery] = useState<string | null>(null);
    const prevQueryRef = useRef<string | null>(null);
    const [results, setResults] = useState<PlaceFeature[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchErr, setSearchErr] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const [gpsCoord, setGpsCoord] = useState<Coordinate | null>(() =>
        readCachedGpsFix(),
    );
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'locating' | 'resolved' | 'unavailable'
    >(() => (readCachedGpsFix() ? 'resolved' : 'locating'));
    const [gpsErr, setGpsErr] = useState<string | null>(null);
    const [gpsRecovery, setGpsRecovery] = useState<'permission' | null>(null);
    const [gpsPriming, setGpsPriming] = useState(() => !readCachedGpsFix());

    const [pinCoord, setPinCoord] = useState<Coordinate | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [draftAddress, setDraftAddress] = useState<string>('');

    const doneButtonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Menyimpan koordinat drag paling akhir, dipakai saat
    // onAddressResolved datang dari BusinessLocationMap.
    const latestDragCoordRef = useRef<Coordinate | null>(null);

    const gpsRid = useRef(0);
    const gpsRetry = useRef(0);
    const gpsAccuracyRetry = useRef(0);
    const gpsBestFix = useRef<{ coord: Coordinate; accuracy: number } | null>(
        null,
    );
    const gpsLast = useRef(0);
    const gpsErrTmo = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Snapshot terbaru selectedCoord & pinCoord — dipakai di dalam
    // requestGps (useCallback dengan deps kosong) supaya tidak kena stale
    // closure saat mengecek apakah lokasi sudah terisi sebelum GPS resolve.
    const selectedCoordRef = useRef<Coordinate | null>(null);
    const pinCoordRef = useRef<Coordinate | null>(null);

    /* ---- Derived ---- */
    const [inputValue, setInputValue] = useState('');
    const query = inputValue;

    const selectedCoord = useMemo(
        () => coordinateFromValues(selectedLatitude, selectedLongitude) ?? null,
        [selectedLatitude, selectedLongitude],
    );

    useEffect(() => {
        selectedCoordRef.current = selectedCoord;
    }, [selectedCoord]);

    useEffect(() => {
        pinCoordRef.current = pinCoord;
    }, [pinCoord]);

    const fallback = useMemo((): { coord: Coordinate; label: string } => {
        if (selectedCoord) {
            return { coord: selectedCoord, label: 'Dari lokasi terpilih' };
        }

        return { coord: SurakartaCoordinate, label: 'Surakarta' };
    }, [selectedCoord]);

    const origin: Coordinate = pinCoord ?? selectedCoord ?? fallback.coord;
    const isSearchMode = query.trim() !== '';
    const hasLocation = Boolean(pinCoord ?? selectedCoord);

    /* ---- GPS ---- */
    const requestGps = useCallback((isActive?: () => boolean) => {
        gpsRid.current += 1;
        const rid = gpsRid.current;
        const active = () =>
            gpsRid.current === rid && (!isActive || isActive());

        // Pre-query/cache permission state
        void readGeolocationPermission();

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

                    if (
                        !gpsBestFix.current ||
                        accuracy < gpsBestFix.current.accuracy
                    ) {
                        gpsBestFix.current = { coord: c, accuracy };
                    }

                    const accurateEnough = isLocationAccurateEnough(pos);

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

                        const finalFix = accurateEnough
                            ? { coord: c, accuracy }
                            : (gpsBestFix.current ?? { coord: c, accuracy });

                        setGpsCoord(finalFix.coord);
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

                        // Auto-locate saat drawer dibuka HANYA boleh
                        // mengisi titik biru (gpsCoord) di atas. Kalau
                        // alamat/pin sudah ada isinya (mode edit lokasi
                        // bisnis, atau user sudah sempat pilih lokasi lain
                        // sebelum GPS ini resolve), JANGAN pindahkan pin —
                        // pin cuma boleh auto-diisi GPS kalau lokasi masih
                        // benar-benar kosong.
                        if (selectedCoordRef.current || pinCoordRef.current) {
                            return;
                        }

                        setPinCoord(finalFix.coord);
                        setDraftAddress('Memuat alamat...');

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

                        if (cachedPermissionState === 'granted') {
                            if (!active()) {
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

                            return;
                        }

                        readGeolocationPermission().then((state) => {
                            if (!active()) {
                                return;
                            }

                            if (
                                err.code ===
                                    GeolocationPositionError.PERMISSION_DENIED ||
                                state === 'denied'
                            ) {
                                setGpsCoord(null);
                                setGpsErr(
                                    'Izinkan lokasi untuk menampilkan lokasi saat ini.',
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
        // Ini dipicu tombol "gunakan lokasi saat ini" — aksi eksplisit
        // user, jadi BOLEH selalu menimpa pin (beda dari auto-locate saat
        // drawer dibuka).

        // Pre-query/cache permission state
        void readGeolocationPermission();

        // Pakai cache kalau masih valid
        const cached = readCachedGpsFix();

        if (cached) {
            const [lat, lng] = cached;

            setGpsCoord(cached);
            setPinCoord(cached);
            setGpsStatus('resolved');
            setGpsErr(null);
            setGpsRecovery(null);
            setGpsPriming(false);

            setDraftAddress('Memuat alamat...');

            void reverseGeocodeCoordinate(cached).then((addr) => {
                setDraftAddress(
                    addr ||
                        `${formatCoordinate(lat)}, ${formatCoordinate(lng)}`,
                );
            });

            return;
        }

        // Invalidasi requestGps yang mungkin masih berjalan di background
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

                () => {
                    setGpsCoord(null);
                    setGpsErr(
                        'Gagal mengambil lokasi saat ini. Pastikan izin lokasi aktif.',
                    );
                    setGpsStatus('unavailable');
                    setGpsPriming(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
            );
        };

        attempt();
    }, [setDraftAddress]);

    /* ---- Effects ---- */

    // Minta GPS saat buka
    useEffect(() => {
        if (!open) {
            return;
        }

        // Cache permission status sembari inisialisasi
        void readGeolocationPermission();

        if (gpsCoord) {
            return;
        }

        let a = true;
        const t = window.setTimeout(() => {
            if (a) {
                requestGps(() => a);
            }
        }, 0);

        return () => {
            a = false;
            window.clearTimeout(t);
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

            if (!gpsCoord) {
                setGpsPriming(true);
                setGpsStatus('locating');
            } else {
                setGpsPriming(false);
            }
        }, 0);

        return () => window.clearTimeout(t);
    }, [gpsCoord, open]);

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
                setInputValue('');
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
                    setGpsPriming(true);
                    setGpsStatus('locating');
                } else {
                    setGpsPriming(false);
                }
            }

            onOpenChange(next);
        },
        [gpsCoord, onOpenChange],
    );

    const handleDone = useCallback(() => {
        if (pinCoord) {
            onLocationSelect({
                latitude: formatCoordinate(pinCoord[0]),
                longitude: formatCoordinate(pinCoord[1]),
                address:
                    draftAddress ||
                    `${formatCoordinate(pinCoord[0])}, ${formatCoordinate(pinCoord[1])}`,
            });
        }

        onRadiusChange?.(radiusKm);
        handleOpen(false);
    }, [
        pinCoord,
        draftAddress,
        onLocationSelect,
        onRadiusChange,
        radiusKm,
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
                // Keluar total dari mode search supaya `showMap` kembali
                // true dan user langsung lihat pin baru di peta. Sebelumnya
                // hanya `draftQuery` yang diisi, sedangkan `inputValue`
                // (penentu `isSearchMode`) tidak pernah direset — akibatnya
                // drawer nyangkut di panel hasil pencarian walau pin sudah
                // pindah di state.
                setInputValue('');
                setDraftQuery('');
                prevQueryRef.current = null;
                setResults([]);
                setSearchErr(null);
                setHasSearched(false);
                setIsSearching(false);
                setIsSearchActive(false);
                releaseInputFocus();
            }
        },
        [releaseInputFocus],
    );

    /* ---- UI ---- */
    const noResults =
        hasSearched && !isSearching && !searchErr && results.length === 0;
    const showMap = !isSearchActive && !isSearchMode;

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

    return (
        <Drawer open={open} onOpenChange={handleOpen} swipeDirection="right">
            <DrawerContent className="m-0 h-[100svh] max-h-none w-full max-w-none rounded-none border-0 bg-card text-card-foreground shadow-xl [--drawer-inset:0px] md:m-2 md:h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-1rem)] md:w-[28rem] md:max-w-[calc(100vw-1rem)] md:rounded-3xl md:border md:[--drawer-inset:--spacing(2)]">
                <Command
                    shouldFilter={false}
                    className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border-none p-0 shadow-2xl outline-none sm:rounded-xl"
                >
                    {/* Header */}
                    <div className="relative z-[1002] flex shrink-0 items-center gap-1 border-b bg-background px-3 py-1.5 sm:py-2">
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
                                placeholder="Cari lokasi catering (nama jalan, gedung, area...)"
                                wrapperClassName="p-0"
                                className="h-10 min-w-0 border-none bg-transparent pr-9 text-[15px] shadow-none focus-visible:ring-0"
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
                                <BusinessLocationMap
                                    selectedLatitude={
                                        pinCoord
                                            ? formatCoordinate(pinCoord[0])
                                            : selectedLatitude
                                    }
                                    selectedLongitude={
                                        pinCoord
                                            ? formatCoordinate(pinCoord[1])
                                            : selectedLongitude
                                    }
                                    selectedAddress={
                                        draftAddress || selectedAddress
                                    }
                                    currentLocation={gpsCoord}
                                    currentLocationLoading={
                                        gpsStatus === 'locating'
                                    }
                                    onLocationFound={(coords, accuracy) => {
                                        setGpsCoord(coords);
                                        setPinCoord(coords);
                                        setGpsStatus('resolved');
                                        setGpsRecovery(null);
                                        setGpsPriming(false);
                                        writeCachedGpsFix(coords, accuracy);
                                    }}
                                    onLocateCurrentLocation={
                                        handleUseCurrentLocation
                                    }
                                    onCoordinateChange={(coords) => {
                                        latestDragCoordRef.current = coords;
                                        setPinCoord(coords);
                                        setDraftAddress('Memuat alamat...');
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
                                    radiusKm={radiusKm}
                                    mapClassName="h-56 min-h-48 sm:h-64"
                                />

                                {/* Info lokasi & radius di bawah peta */}
                                <div className="mt-2 flex flex-col gap-2">
                                    {gpsPriming && gpsStatus === 'locating' && (
                                        <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-xs text-muted-foreground dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                            <LoaderCircle className="size-4 shrink-0 animate-spin" />
                                            <span className="truncate font-medium">
                                                Mengambil lokasi saat ini...
                                            </span>
                                        </div>
                                    )}
                                    {gpsErr && (
                                        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-600 dark:border-red-800/60 dark:bg-red-900/50">
                                            <MapPin className="size-4 shrink-0" />
                                            <span className="truncate font-medium">
                                                {gpsErr}
                                            </span>
                                        </div>
                                    )}
                                    {gpsRecovery === 'permission' && (
                                        <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-600 dark:border-amber-800/60 dark:bg-amber-900/50">
                                            <span className="truncate">
                                                Izinkan akses lokasi di browser
                                                Anda untuk menggunakan fitur
                                                ini.
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-xs dark:border-zinc-800/60 dark:bg-zinc-900/50">
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
                                    {hasLocation && (
                                        <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 dark:border-zinc-800/60 dark:bg-zinc-900/50">
                                            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-4 shrink-0 items-center justify-center">
                                                        <div className="size-3 rounded-full border-2 border-zinc-800 dark:border-zinc-200" />
                                                    </div>
                                                    <span className="truncate font-medium text-foreground">
                                                        Radius area layanan
                                                    </span>
                                                </div>
                                                <span className="font-bold text-primary">
                                                    {radiusKm} km
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={1}
                                                max={100}
                                                step={1}
                                                value={radiusKm}
                                                onChange={(e) => {
                                                    const v = Number(
                                                        e.target.value,
                                                    );
                                                    onRadiusChange?.(v);
                                                }}
                                                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
                                                aria-label="Radius area layanan"
                                            />
                                            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                                <span>1 km</span>
                                                <span>100 km</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Panel hasil pencarian */}
                        {isSearchMode && (
                            <div className="flex min-w-0 shrink-0 flex-col overflow-hidden border-b border-border/30 bg-transparent">
                                <div className="flex items-center justify-between gap-2 px-4 py-2">
                                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground/40 uppercase">
                                        Hasil Pencarian
                                    </span>
                                </div>
                                <div className="min-h-0">
                                    {isSearching ? (
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
                                        <CommandList className="max-h-none overflow-x-hidden p-0">
                                            {searchErr &&
                                                results.length === 0 && (
                                                    <CommandEmpty className="px-4 py-6">
                                                        <span className="text-xs text-muted-foreground/55">
                                                            {searchErr}
                                                        </span>
                                                    </CommandEmpty>
                                                )}
                                            {noResults && (
                                                <CommandEmpty className="px-4 py-6">
                                                    <span className="text-xs text-muted-foreground/55">
                                                        Lokasi tidak ditemukan.
                                                    </span>
                                                </CommandEmpty>
                                            )}
                                            {results.length > 0 && (
                                                <CommandGroup className="p-0">
                                                    {results.map((f) => (
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
                                                            className="group cursor-pointer rounded-none bg-transparent px-4 py-3 transition-colors data-selected:bg-transparent data-selected:text-primary [&>svg:last-child]:hidden"
                                                            onSelect={() =>
                                                                handleSelect(f)
                                                            }
                                                        >
                                                            <div className="grid w-full max-w-full min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-3 overflow-hidden">
                                                                <div className="mt-0.5 flex min-w-0 flex-col items-center gap-1.5 transition-colors group-data-[selected]:text-primary">
                                                                    <MapPin className="size-5 text-muted-foreground/45 group-data-[selected]:text-primary" />
                                                                    <span className="text-[10px] font-bold tracking-tight text-muted-foreground/40 group-data-[selected]:text-primary/70">
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
                                                                    <span className="block max-w-full truncate text-sm font-semibold tracking-tight text-foreground transition-colors group-data-[selected]:text-primary">
                                                                        {displayPlaceTitle(
                                                                            f,
                                                                        )}
                                                                    </span>
                                                                    <span className="block max-w-full truncate text-xs leading-snug text-muted-foreground/55 group-data-[selected]:text-primary/60">
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
                        )}
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
                                Konfirmasi Lokasi
                            </Button>
                        </div>
                    )}
                </Command>
            </DrawerContent>
        </Drawer>
    );
}
