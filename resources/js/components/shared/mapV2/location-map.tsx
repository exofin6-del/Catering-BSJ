import L from 'leaflet';

import { LoaderCircle, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

import {
    Map,
    MapControlContainer,
    MapLocateControl,
    MapMarker,
    MapTileLayer,
    MapZoomControl,
} from '@/components/ui/map';
import { cn } from '@/lib/utils';

import type { Coordinate } from './location-utils';
import {
    coordinateFromValues,
    formatCoordinate,
    formatDistance,
    MaximumCurrentLocationAccuracyMeters,
    reverseGeocodeCoordinate,
    SurakartaCoordinate,
} from './location-utils';

/* ============================================================================
 * Types
 * ========================================================================== */

export type MapV2LocationMapProps = {
    className?: string;
    mapClassName?: string;
    variant?: 'compact' | 'focus' | 'stacked';
    selectedLatitude?: string | null;
    selectedLongitude?: string | null;
    selectedAddress?: string | null;
    currentLocation?: Coordinate | null;
    currentLocationLoading?: boolean;
    onCoordinateChange?: (coordinate: Coordinate) => void;
    onAddressResolved?: (address: string) => void;
    onLocationFound?: (coordinate: Coordinate, accuracy: number) => void;
    onLocateCurrentLocation?: () => void;
    businessLatitude?: string | null;
    businessLongitude?: string | null;
};

/* ============================================================================
 * MapV2LocationMap
 * ========================================================================== */

export function MapV2LocationMap({
    className,
    mapClassName,
    variant = 'compact',
    selectedLatitude,
    selectedLongitude,
    selectedAddress,
    currentLocation = null,
    currentLocationLoading = false,
    onCoordinateChange,
    onAddressResolved,
    onLocationFound: onLocationFoundProps,
    onLocateCurrentLocation,
    businessLatitude,
    businessLongitude,
}: MapV2LocationMapProps) {
    const [isResolvingAddress, setIsResolvingAddress] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isCompactMapFullscreen, setIsCompactMapFullscreen] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isMapMoving, setIsMapMoving] = useState(false);
    // Setiap kali locate diklik, token naik → MapViewportHandler reset
    // lastFlyToCoordRef sehingga flyTo SELALU jalan walau koordinatnya sama.
    const [locateToken, setLocateToken] = useState(0);
    const isUserPanningRef = useRef(false);
    const isAutoMovingRef = useRef(false);

    const lastLocationFoundAt = useRef<number>(0);
    const pendingErrorTimeout = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const locateRequestId = useRef<number>(0);
    const wasCurrentLocationLoadingRef = useRef(currentLocationLoading);

    const isCompactMap = variant === 'compact';
    const isMapInteractionEnabled = true;
    const showMapZoomControl = variant === 'focus' || isCompactMapFullscreen;

    const currentCoordinate = useMemo(
        () => coordinateFromValues(selectedLatitude, selectedLongitude) ?? null,
        [selectedLatitude, selectedLongitude],
    );

    const businessCoordinate = useMemo(
        () => coordinateFromValues(businessLatitude, businessLongitude) ?? null,
        [businessLatitude, businessLongitude],
    );

    const initialMapCoordinate = useMemo((): Coordinate => {
        if (currentLocation) {
            return currentLocation;
        }

        if (currentCoordinate) {
            return currentCoordinate;
        }

        if (businessCoordinate) {
            return businessCoordinate;
        }

        return SurakartaCoordinate;
    }, [businessCoordinate, currentCoordinate, currentLocation]);

    const viewportCoordinate: Coordinate | null = isCompactMap
        ? (currentCoordinate ?? currentLocation ?? initialMapCoordinate)
        : (currentCoordinate ?? initialMapCoordinate);

    const selectedLocationText = useMemo(() => {
        if (isLocating || isResolvingAddress) {
            return 'Mencari lokasi saat ini...';
        }

        if (selectedAddress?.trim()) {
            return selectedAddress;
        }

        if (currentCoordinate) {
            return `${formatCoordinate(currentCoordinate[0])}, ${formatCoordinate(currentCoordinate[1])}`;
        }

        return 'Lokasi belum dipilih';
    }, [isLocating, isResolvingAddress, selectedAddress, currentCoordinate]);

    const handleUpdateLocation = useCallback(
        async (
            coordinate: Coordinate,
            options: { resolveAddress?: boolean; address?: string } = {},
        ) => {
            onCoordinateChange?.(coordinate);

            if (options.address) {
                onAddressResolved?.(options.address);
                setLocationError(null);

                return;
            }

            if (options.resolveAddress) {
                // Bump di sini (bukan cuma saat klik locate) supaya drag
                // beruntun saling membatalkan — hasil reverse-geocode dari
                // drag lama tidak bisa lagi menimpa drag yang lebih baru
                // walau resolve-nya out-of-order.
                const requestId = ++locateRequestId.current;

                setIsResolvingAddress(true);
                setLocationError(null);

                try {
                    const address = await reverseGeocodeCoordinate(coordinate);

                    if (requestId !== locateRequestId.current) {
                        return;
                    }

                    if (address) {
                        onAddressResolved?.(address);
                    } else {
                        setLocationError(
                            'Alamat tidak ditemukan di titik ini.',
                        );
                    }
                } catch {
                    if (requestId === locateRequestId.current) {
                        setLocationError('Gagal mengambil alamat.');
                    }
                } finally {
                    if (requestId === locateRequestId.current) {
                        setIsResolvingAddress(false);
                        setIsLocating(false);
                    }
                }
            } else {
                setIsLocating(false);
            }
        },
        [onAddressResolved, onCoordinateChange],
    );

    const handleLocationFound = useCallback(
        (latlng: L.LatLng, accuracy: number) => {
            if (pendingErrorTimeout.current) {
                clearTimeout(pendingErrorTimeout.current);
                pendingErrorTimeout.current = null;
            }

            setLocationError(null);
            lastLocationFoundAt.current = Date.now();

            if (accuracy > MaximumCurrentLocationAccuracyMeters) {
                setLocationError(
                    `Lokasi ditemukan, namun kurang akurat (${formatDistance(accuracy)}). Coba geser peta ke posisi yang lebih tepat.`,
                );
            }

            isUserPanningRef.current = false;
            onLocationFoundProps?.([latlng.lat, latlng.lng], accuracy);

            // handleUpdateLocation -> onCoordinateChange -> selectedLatitude/Longitude
            // berubah -> currentCoordinate berubah -> viewportCoordinate berubah
            // -> MapViewportHandler yang akan flyTo, BUKAN kita di sini.
            void handleUpdateLocation([latlng.lat, latlng.lng], {
                resolveAddress: true,
            });
        },
        [handleUpdateLocation, onLocationFoundProps],
    );

    const handleLocationError = useCallback((message: string) => {
        if (Date.now() - lastLocationFoundAt.current < 4000) {
            setIsLocating(false);

            return;
        }

        if (pendingErrorTimeout.current) {
            clearTimeout(pendingErrorTimeout.current);
        }

        pendingErrorTimeout.current = setTimeout(() => {
            setIsLocating(false);
            pendingErrorTimeout.current = null;
            const isDenied = message.toLowerCase().includes('denied');

            setLocationError(
                isDenied
                    ? 'Gagal melacak lokasi. Pastikan akses lokasi diizinkan di browser Anda.'
                    : message || 'Gagal mencari lokasi.',
            );
        }, 1200);
    }, []);

    const handleLocationStart = useCallback(() => {
        locateRequestId.current += 1;
        setIsLocating(true);
        setIsResolvingAddress(false);
        setLocationError(null);
        isUserPanningRef.current = false;

        if (pendingErrorTimeout.current) {
            clearTimeout(pendingErrorTimeout.current);
            pendingErrorTimeout.current = null;
        }
    }, []);

    useEffect(() => {
        const wasLoading = wasCurrentLocationLoadingRef.current;
        wasCurrentLocationLoadingRef.current = currentLocationLoading;

        // GPS diminta oleh command di luar peta karena kontrol memakai
        // externalLocationHandling. Lepaskan loading lokal ketika command
        // selesai agar tombol locate bisa dipakai kembali.
        if (
            isLocating &&
            currentLocation &&
            wasLoading &&
            !currentLocationLoading
        ) {
            setIsLocating(false);
        }
    }, [currentLocation, currentLocationLoading, isLocating]);

    const handleMoveStart = useCallback((isAutoMoving: boolean) => {
        if (!isAutoMoving) {
            isUserPanningRef.current = true;
        }

        setIsMapMoving(true);
    }, []);

    const handleMoveEnd = useCallback(
        (centerCoordinate: Coordinate, isAutoMoving: boolean) => {
            setIsMapMoving(false);

            if (isAutoMoving) {
                return;
            }

            void handleUpdateLocation(centerCoordinate, {
                resolveAddress: true,
            });
            setTimeout(() => {
                isUserPanningRef.current = false;
            }, 100);
        },
        [handleUpdateLocation],
    );

    useEffect(() => {
        return () => {
            if (pendingErrorTimeout.current) {
                clearTimeout(pendingErrorTimeout.current);
            }
        };
    }, []);

    return (
        <div
            className={cn(
                'grid gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]',
                (variant === 'compact' || variant === 'focus') &&
                    'gap-0 overflow-hidden border-slate-200 bg-background p-0 dark:border-white/[0.08]',
                className,
            )}
        >
            <div
                className={cn(
                    'relative isolate overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.04]',
                    (variant === 'compact' || variant === 'focus') &&
                        'rounded-none border-0',
                )}
            >
                <div
                    className={cn(
                        'relative h-72 min-h-0 w-full rounded-none md:h-80',
                        mapClassName,
                    )}
                >
                    <Map
                        center={initialMapCoordinate}
                        zoom={18}
                        className="h-full min-h-0 w-full"
                    >
                        <MapTileLayer name="CARTO" />

                        {showMapZoomControl && (
                            <MapZoomControl position="bottom-3 left-3" />
                        )}
                        <MapLocateControl
                            position="right-3 bottom-3"
                            showMarker={false}
                            externalLocationHandling
                            loading={isLocating || currentLocationLoading}
                            onClick={() => {
                                // GPS diminta oleh command di luar kontrol
                                // Leaflet. Tetap tandai request ini supaya
                                // hasilnya selalu mendapat animasi fly-to.
                                handleLocationStart();
                                setLocateToken((t) => t + 1);
                                onLocateCurrentLocation?.();
                            }}
                            onLocationStart={handleLocationStart}
                            onLocationFound={handleLocationFound}
                            onLocationError={handleLocationError}
                        />
                        <MapCenterMoveHandler
                            onMoveStart={handleMoveStart}
                            onMoveEnd={handleMoveEnd}
                            onViewportChange={onCoordinateChange}
                            onReady={() => setIsMapReady(true)}
                            isAutoMovingRef={isAutoMovingRef}
                        />
                        {isCompactMap && (
                            <MapCompactInteractionHandler
                                isInteractionEnabled={isMapInteractionEnabled}
                                onFullscreenChange={setIsCompactMapFullscreen}
                            />
                        )}
                        <MapViewportHandler
                            coordinate={viewportCoordinate}
                            isUserPanningRef={isUserPanningRef}
                            isAutoMovingRef={isAutoMovingRef}
                            isLocating={isLocating}
                            locateToken={locateToken}
                            isMapReady={isMapReady}
                        />
                        {currentLocation && (
                            <MapMarker
                                position={currentLocation}
                                icon={
                                    <div className="relative flex size-8 items-center justify-center">
                                        <div className="absolute inline-flex size-4 rounded-full bg-blue-600 shadow-md ring-2 shadow-blue-500/50 ring-white" />
                                    </div>
                                }
                                iconAnchor={[16, 16]}
                            />
                        )}
                        {locationError && !isCompactMap && (
                            <MapControlContainer className="top-14 right-3 max-w-[20rem] rounded-lg bg-destructive px-3 py-2 text-xs text-destructive-foreground shadow-lg">
                                {locationError}
                            </MapControlContainer>
                        )}
                    </Map>
                    <div className="pointer-events-none absolute inset-0 z-[500]">
                        {/*
                            Ujung pin (bukan tengah box-nya) harus persis di
                            titik tengah peta (top-1/2 left-1/2), karena itu
                            titik yang sama dipakai leaflet buat nempatkan
                            titik biru & koordinat yang dilaporkan saat
                            drag/moveend. Sebelumnya box h-12 di-center via
                            flex, jadi bottom-0 di dalamnya jatuh ±24px di
                            bawah titik tengah asli — pin keliatan meleset
                            dari titik biru lokasi saat ini.
                        */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
                            <div
                                className={cn(
                                    'relative transition-all duration-150',
                                    isMapMoving
                                        ? '-translate-y-3 scale-105'
                                        : 'translate-y-0 scale-100',
                                )}
                            >
                                <MapPin className="size-10 fill-rose-600 text-white drop-shadow-[0_6px_14px_rgba(244,63,94,0.35)]" />
                            </div>

                            {/* Shadow */}
                            <div
                                className={cn(
                                    'absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-black/20 blur-sm transition-all duration-150',
                                    isMapMoving
                                        ? 'h-1 w-3 opacity-30'
                                        : 'h-1.5 w-5 opacity-60',
                                )}
                            />
                        </div>
                    </div>
                </div>
                {!isMapReady && (
                    <div className="absolute inset-0 z-[1001] animate-pulse bg-background p-4">
                        <div className="h-full rounded-md bg-muted/70" />
                        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 text-sm text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" />
                            Memuat peta...
                        </div>
                    </div>
                )}
            </div>
            {variant === 'stacked' && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{selectedLocationText}</span>
                </div>
            )}
        </div>
    );
}

/* ============================================================================
 * MapCenterMoveHandler
 * ========================================================================== */

function MapCenterMoveHandler({
    onMoveStart,
    onMoveEnd,
    onViewportChange,
    onReady,
    isAutoMovingRef,
}: {
    onMoveStart: (isAutoMoving: boolean) => void;
    onMoveEnd: (center: Coordinate, isAutoMoving: boolean) => void;
    onViewportChange?: (center: Coordinate) => void;
    onReady: () => void;
    isAutoMovingRef: React.RefObject<boolean>;
}) {
    const map = useMapEvents({
        movestart: () => {
            onMoveStart(isAutoMovingRef.current);
        },
        moveend: () => {
            const center = map.getCenter();
            const coordinate: Coordinate = [center.lat, center.lng];
            const wasAutoMoving = isAutoMovingRef.current;

            onMoveEnd(coordinate, wasAutoMoving);

            if (!wasAutoMoving) {
                onViewportChange?.(coordinate);
            }

            isAutoMovingRef.current = false;
        },
    });

    useEffect(() => {
        let settled = false;
        let errorRetries = 0;
        const maxErrorRetries = 2;

        // Map 'load' terpicu hampir instan saat peta di-init (bukan saat
        // ubin selesai dimuat), dan 'tileload' cuma nunggu ubin PERTAMA —
        // makanya skeleton sebelumnya hilang padahal peta masih blank/abu-abu.
        // Yang benar: dengarkan event 'load' milik tile layer itu sendiri,
        // yang baru terpicu setelah SEMUA ubin yang terlihat selesai dimuat.
        const tileLayers: L.TileLayer[] = [];
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                tileLayers.push(layer);
            }
        });

        const markReady = () => {
            if (settled) {
                return;
            }

            settled = true;
            window.clearTimeout(fallbackReadyTimer);
            onReady();
        };

        // Coba lagi kalau ada ubin yang gagal dimuat (mis. koneksi kurang
        // stabil), sebelum akhirnya pasrah ke fallback timer.
        const handleTileError = () => {
            if (errorRetries >= maxErrorRetries) {
                return;
            }

            errorRetries += 1;
            window.setTimeout(() => {
                tileLayers.forEach((layer) => layer.redraw());
            }, 600);
        };

        // Fallback murni sebagai jaring pengaman kalau tile layer gagal
        // total (mis. offline) — bukan pemicu dini seperti 500ms sebelumnya
        // yang bikin peta "dianggap siap" padahal ubin belum benar-benar
        // termuat.
        //
        // HARUS dideklarasikan sebelum forEach di bawah: markReady() bisa
        // terpanggil secara sinkron saat layer sudah selesai load dari cache
        // (layer.isLoading() === false). Kalau fallbackReadyTimer belum
        // ter-init, aksesnya memicu ReferenceError (Temporal Dead Zone).
        const fallbackReadyTimer = window.setTimeout(markReady, 6000);

        tileLayers.forEach((layer) => {
            // Tile layer bisa saja sudah selesai load dari cache SEBELUM
            // listener ini terpasang — cek dulu supaya tidak nunggu event
            // 'load' yang sudah lewat dan tidak akan terpicu lagi.
            if (typeof layer.isLoading === 'function' && !layer.isLoading()) {
                markReady();
            }

            layer.once('load', markReady);
            layer.on('tileerror', handleTileError);
        });

        return () => {
            settled = true;
            window.clearTimeout(fallbackReadyTimer);
            tileLayers.forEach((layer) => {
                layer.off('load', markReady);
                layer.off('tileerror', handleTileError);
            });
        };
    }, [map, onReady]);

    return null;
}

/* ============================================================================
 * MapCompactInteractionHandler
 * ========================================================================== */

function MapCompactInteractionHandler({
    isInteractionEnabled,
    onFullscreenChange,
}: {
    isInteractionEnabled: boolean;
    onFullscreenChange: (isFullscreen: boolean) => void;
}) {
    const map = useMapEvents({
        enterFullscreen: () => onFullscreenChange(true),
        exitFullscreen: () => onFullscreenChange(false),
    });

    useEffect(() => {
        const handlers = [
            map.dragging,
            map.touchZoom,
            map.doubleClickZoom,
            map.scrollWheelZoom,
            map.boxZoom,
            map.keyboard,
        ];
        handlers.forEach((h) => {
            if (isInteractionEnabled) {
                h.enable();
            } else {
                h.disable();
            }
        });

        return () => handlers.forEach((h) => h.enable());
    }, [isInteractionEnabled, map]);

    return null;
}

/* ============================================================================
 * MapViewportHandler
 * ========================================================================== */

function MapViewportHandler({
    coordinate,
    isUserPanningRef,
    isAutoMovingRef,
    isLocating,
    locateToken,
    isMapReady,
}: {
    coordinate: Coordinate | null;
    isUserPanningRef: React.RefObject<boolean>;
    isAutoMovingRef: React.RefObject<boolean>;
    isLocating: boolean;
    locateToken: number;
    isMapReady: boolean;
}) {
    const map = useMap();
    const lastFlyToCoordRef = useRef<string | null>(null);
    const lastLocateTokenRef = useRef(locateToken);
    const forceFlyRef = useRef(false);

    // Reset cache saat locate diklik supaya flyTo tetap berjalan walau
    // koordinat GPS sama dengan posisi terakhir.
    useEffect(() => {
        if (!isMapReady) {
            return;
        }

        if (lastLocateTokenRef.current !== locateToken) {
            lastLocateTokenRef.current = locateToken;
            lastFlyToCoordRef.current = null;
            forceFlyRef.current = true;
        }
    }, [locateToken, isMapReady]);

    useEffect(() => {
        // Jangan flyTo sebelum peta siap — penyebab peta bergetar
        // (shimmer/shake) saat pertama kali dibuka.
        if (!coordinate || !isMapReady) {
            return;
        }

        const key = `${coordinate[0].toFixed(6)},${coordinate[1].toFixed(6)}`;

        // Saat pertama siap, cegah animasi yang tidak diperlukan. Request
        // locate dikecualikan dari skip ini agar koordinat yang sama pun
        // tetap melewati siklus fly-to dan landing pin.
        if (lastFlyToCoordRef.current === null) {
            const center = map.getCenter();
            lastFlyToCoordRef.current = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;

            if (lastFlyToCoordRef.current === key && !forceFlyRef.current) {
                return;
            }
        }

        if (
            (isLocating || !isUserPanningRef.current) &&
            (lastFlyToCoordRef.current !== key || forceFlyRef.current)
        ) {
            lastFlyToCoordRef.current = key;
            forceFlyRef.current = false;
            isAutoMovingRef.current = true;
            map.stop();
            map.flyTo(coordinate, Math.max(map.getZoom(), 18), {
                animate: true,
                duration: 0.9,
                easeLinearity: 0.2,
            });
        }
    }, [
        coordinate,
        isAutoMovingRef,
        isUserPanningRef,
        isLocating,
        locateToken,
        isMapReady,
        map,
    ]);

    return null;
}
