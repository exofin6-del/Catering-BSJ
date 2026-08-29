import L from 'leaflet';

import { LoaderCircle, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';

import type { Coordinate } from '@/components/mapV2/location-utils';
import {
    coordinateFromValues,
    reverseGeocodeCoordinate,
    SurakartaCoordinate,
} from '@/components/mapV2/location-utils';
import {
    Map,
    MapLocateControl,
    MapMarker,
    MapTileLayer,
    MapZoomControl,
} from '@/components/ui/map';
import { cn } from '@/lib/utils';

/* ============================================================================
 * Types
 * ========================================================================== */

export type BusinessLocationMapProps = {
    className?: string;
    mapClassName?: string;
    selectedLatitude?: string | null;
    selectedLongitude?: string | null;
    selectedAddress?: string | null;
    currentLocation?: Coordinate | null;
    currentLocationLoading?: boolean;
    onCoordinateChange?: (coordinate: Coordinate) => void;
    onAddressResolved?: (address: string) => void;
    onLocationFound?: (coordinate: Coordinate, accuracy: number) => void;
    onLocateCurrentLocation?: () => void;
    /** Radius lingkaran area layanan dalam kilometer */
    radiusKm?: number;
};

/* ============================================================================
 * Zoom helper — hitung zoom level agar lingkaran radius terlihat utuh
 * ========================================================================== */

function zoomForRadius(radiusKm: number): number {
    if (radiusKm <= 1) {
        return 15;
    }

    if (radiusKm <= 3) {
        return 13;
    }

    if (radiusKm <= 7) {
        return 12;
    }

    if (radiusKm <= 15) {
        return 11;
    }

    if (radiusKm <= 30) {
        return 10;
    }

    if (radiusKm <= 60) {
        return 9;
    }

    return 8;
}

/* ============================================================================
 * BusinessLocationMap
 *
 * Versi peta khusus untuk pengaturan area layanan bisnis. Berbeda dari
 * `MapV2LocationMap`, komponen ini MENAMBAHKAN lingkaran radius area
 * layanan (service area circle) di tengah peta sehingga admin bisa
 * melihat jangkauan pengantaran secara visual saat memilih lokasi.
 *
 * Lingkaran radius dikelola LANGSUNG via Leaflet API (bukan React state)
 * supaya update-nya mulus tanpa re-render 60fps yang bikin peta getar.
 * ========================================================================== */

export function BusinessLocationMap({
    className,
    mapClassName,
    selectedLatitude,
    selectedLongitude,
    currentLocation = null,
    currentLocationLoading = false,
    onCoordinateChange,
    onAddressResolved,
    onLocationFound: onLocationFoundProps,
    onLocateCurrentLocation,
    radiusKm = 1,
}: BusinessLocationMapProps) {
    const [isLocating, setIsLocating] = useState(false);
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

    const currentCoordinate = useMemo(
        () => coordinateFromValues(selectedLatitude, selectedLongitude) ?? null,
        [selectedLatitude, selectedLongitude],
    );

    const initialMapCoordinate = useMemo((): Coordinate => {
        if (currentCoordinate) {
            return currentCoordinate;
        }

        if (currentLocation) {
            return currentLocation;
        }

        return SurakartaCoordinate;
    }, [currentCoordinate, currentLocation]);

    const viewportCoordinate: Coordinate | null =
        currentCoordinate ?? currentLocation ?? initialMapCoordinate;

    const handleUpdateLocation = useCallback(
        async (
            coordinate: Coordinate,
            options: { resolveAddress?: boolean; address?: string } = {},
        ) => {
            onCoordinateChange?.(coordinate);

            if (options.address) {
                onAddressResolved?.(options.address);

                return;
            }

            if (options.resolveAddress) {
                // Bump di sini (bukan cuma saat klik locate) supaya drag
                // beruntun saling membatalkan — hasil reverse-geocode dari
                // drag lama tidak bisa lagi menimpa drag yang lebih baru
                // walau resolve-nya out-of-order.
                const requestId = ++locateRequestId.current;

                try {
                    const address = await reverseGeocodeCoordinate(coordinate);

                    if (requestId !== locateRequestId.current) {
                        return;
                    }

                    if (address) {
                        onAddressResolved?.(address);
                    }
                } catch {
                    // reverse geocode failure — biarkan parent handle
                } finally {
                    if (requestId === locateRequestId.current) {
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

            lastLocationFoundAt.current = Date.now();

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

    const handleLocationError = useCallback(() => {
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
        }, 1200);
    }, []);

    const handleLocationStart = useCallback(() => {
        locateRequestId.current += 1;
        setIsLocating(true);
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
        // externalLocationHandling. Lepaskan loading lokal setelah request
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
                'grid gap-0 overflow-hidden rounded-none border-slate-200 bg-background p-0 dark:border-white/[0.08]',
                className,
            )}
        >
            <div className="relative isolate overflow-hidden rounded-none border-0">
                <div
                    className={cn(
                        'relative h-72 min-h-0 w-full rounded-none md:h-80',
                        mapClassName,
                    )}
                >
                    <Map
                        center={initialMapCoordinate}
                        zoom={zoomForRadius(radiusKm)}
                        className="h-full min-h-0 w-full"
                    >
                        <MapTileLayer name="CARTO" />

                        {/* Lingkaran radius area layanan — dikelola langsung
                            via Leaflet API (bukan React state) supaya
                            update-nya mulus tanpa re-render 60fps. */}
                        <MapRadiusCircle
                            center={currentCoordinate ?? initialMapCoordinate}
                            radiusKm={radiusKm}
                            isMapReady={isMapReady}
                        />

                        <MapZoomControl position="bottom-3 left-3" />
                        <MapLocateControl
                            position="right-3 bottom-3"
                            showMarker={false}
                            externalLocationHandling
                            loading={isLocating || currentLocationLoading}
                            onClick={() => {
                                // Tandai request locate agar hasil GPS selalu
                                // menjalankan fly-to yang dianimasikan.
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
                        <MapViewportHandler
                            coordinate={viewportCoordinate}
                            radiusKm={radiusKm}
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
                                        <div className="absolute inline-flex size-8 animate-ping rounded-full bg-blue-500/40" />
                                        <div className="absolute inline-flex size-4 rounded-full bg-blue-600 shadow-md ring-2 shadow-blue-500/50 ring-white" />
                                    </div>
                                }
                                iconAnchor={[16, 16]}
                            />
                        )}
                    </Map>
                    <div className="pointer-events-none absolute inset-0 z-[500]">
                        {/*
                            Ujung pin (bukan tengah box-nya) harus persis di
                            titik tengah peta (top-1/2 left-1/2), karena itu
                            titik yang sama dipakai leaflet buat nempatkan
                            titik biru & koordinat yang dilaporkan saat
                            drag/moveend.
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
        </div>
    );
}

/* ============================================================================
 * MapRadiusCircle — lingkaran radius via Leaflet API langsung
 *
 * Dikelola via useRef + useEffect, BUKAN React state. Update center/radius
 * dengan setLatLng/setRadius langsung ke layer Leaflet — tanpa re-render
 * React 60fps yang bikin peta getar.
 * ========================================================================== */

function MapRadiusCircle({
    center,
    radiusKm,
    isMapReady,
}: {
    center: Coordinate;
    radiusKm: number;
    isMapReady: boolean;
}) {
    const map = useMap();
    const circleRef = useRef<L.Circle | null>(null);
    // Track apakah map sedang bergerak (drag/flyTo) — kalau ya, JANGAN
    // update center via useEffect karena itu akan membuat circle "loncat"
    // ke tujuan akhir alih-alih mengikuti animasi flyTo secara mulus.
    // Selama map bergerak, center circle di-update via useMapEvents move
    // handler yang mengambil map.getCenter() (posisi saat ini, bukan tujuan).
    const isMovingRef = useRef(false);

    // Buat circle sekali saat map ready
    useEffect(() => {
        if (!isMapReady || circleRef.current) {
            return;
        }

        circleRef.current = L.circle(center, {
            radius: radiusKm * 1000,
            color: '#18181b',
            fillColor: '#18181b',
            fillOpacity: 0.1,
            opacity: 0.7,
            weight: 2,
        }).addTo(map);

        return () => {
            if (circleRef.current) {
                map.removeLayer(circleRef.current);
                circleRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMapReady]);

    // Update center langsung tanpa re-render React — HANYA saat map TIDAK
    // sedang bergerak. Kalau map sedang flyTo/drag, biarkan useMapEvents
    // move handler yang mengupdate center supaya circle mengikuti animasi.
    useEffect(() => {
        if (circleRef.current && !isMovingRef.current) {
            circleRef.current.setLatLng(center);
        }
    }, [center]);

    // Update radius langsung tanpa re-render React
    useEffect(() => {
        if (circleRef.current) {
            circleRef.current.setRadius(radiusKm * 1000);
        }
    }, [radiusKm]);

    // Update center saat map bergerak (drag/flyTo) — langsung ke Leaflet
    useMapEvents({
        movestart: () => {
            isMovingRef.current = true;
        },
        move: () => {
            if (circleRef.current) {
                const c = map.getCenter();
                circleRef.current.setLatLng([c.lat, c.lng]);
            }
        },
        moveend: () => {
            isMovingRef.current = false;

            // Setelah animasi selesai, pastikan circle tepat di center
            if (circleRef.current) {
                const c = map.getCenter();
                circleRef.current.setLatLng([c.lat, c.lng]);
            }
        },
    });

    return null;
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
 * MapViewportHandler
 * ========================================================================== */

function MapViewportHandler({
    coordinate,
    radiusKm,
    isUserPanningRef,
    isAutoMovingRef,
    isLocating,
    locateToken,
    isMapReady,
}: {
    coordinate: Coordinate | null;
    radiusKm: number;
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
    const lastRadiusRef = useRef<number | null>(null);
    // Track apakah flyTo dipicu oleh tombol locate — kalau ya, pakai
    // zoomForRadius(radiusKm) supaya lingkaran radius ikut terlihat utuh.
    const locateTriggeredRef = useRef(false);
    // Timeout untuk debounce auto-zoom saat radius digeser. Tanpa ini,
    // tiap tick slider memicu animasi flyTo beruntun yang saling
    // bertumpuk & bikin peta getar.
    const radiusZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    // Zoom level terakhir yang dipakai untuk auto-zoom radius. Dipakai
    // supaya kalau radius berubah dalam rentang zoom yang sama, tidak
    // perlu flyTo (mis. 12 km → 14 km sama-sama zoom 10).
    const lastRadiusZoomRef = useRef<number | null>(null);
    const pendingRadiusZoomRef = useRef<number | null>(null);
    const waitingForMoveEndRef = useRef(false);
    const radiusMoveEndHandlerRef = useRef<(() => void) | null>(null);

    // Reset cache saat locate diklik supaya flyTo tetap berjalan walau
    // koordinat GPS sama dengan posisi terakhir.
    useEffect(() => {
        if (!isMapReady) {
            return;
        }

        if (lastLocateTokenRef.current !== locateToken) {
            lastLocateTokenRef.current = locateToken;
            lastFlyToCoordRef.current = null;
            lastRadiusRef.current = null;
            lastRadiusZoomRef.current = null;
            forceFlyRef.current = true;
            locateTriggeredRef.current = true;
        }
    }, [locateToken, isMapReady]);

    // Bersihkan timeout auto-zoom saat komponen unmount supaya tidak ada
    // flyTo "hantu" setelah peta dibongkar.
    useEffect(() => {
        return () => {
            if (radiusZoomTimeoutRef.current) {
                clearTimeout(radiusZoomTimeoutRef.current);
                radiusZoomTimeoutRef.current = null;
            }

            if (radiusMoveEndHandlerRef.current) {
                map.off('moveend', radiusMoveEndHandlerRef.current);
                radiusMoveEndHandlerRef.current = null;
            }
        };
    }, [map]);

    // Begitu user mulai gesture zoom manual (pinch, scroll, atau tombol
    // +/-), batalkan auto-zoom radius yang masih menunggu di debounce.
    // Tanpa ini, auto-zoom radius bisa "menimpa" zoom yang baru saja
    // diatur user beberapa ratus milidetik setelah gesture selesai.
    useMapEvents({
        zoomstart: () => {
            // Zoom yang kita picu sendiri (radius/locate) juga memancing
            // zoomstart — jangan batalkan diri sendiri.
            if (isAutoMovingRef.current) {
                return;
            }

            if (radiusZoomTimeoutRef.current) {
                clearTimeout(radiusZoomTimeoutRef.current);
                radiusZoomTimeoutRef.current = null;
            }
        },
    });

    // Auto zoom berdasarkan radius — saat radius berubah, sesuaikan zoom
    // level supaya lingkaran area layanan terlihat utuh. Dipakai flyTo
    // dengan animate: true + debounce supaya perpindahan zoom terasa
    // mulus (tidak melompat instan) tapi juga tidak memicu flyTo beruntun
    // yang bikin getar saat slider digeser cepat.
    //
    // Debounce: tunggu 150ms setelah radius terakhir berubah sebelum
    // mulai flyTo. Saat user menarik slider, timeout dibatalkan & direset
    // terus, jadi hanya SATU animasi yang jalan — ke zoom tujuan akhir.
    useEffect(() => {
        if (!isMapReady || lastRadiusRef.current === null) {
            return;
        }

        if (lastRadiusRef.current !== radiusKm) {
            lastRadiusRef.current = radiusKm;

            const targetZoom = zoomForRadius(radiusKm);

            // Skip bila zoom target sama dengan yang sudah dipakai — supaya
            // tetap di radius yang sama (mis. 12 → 14 km, sama-sama 10)
            // tidak perlu animasi yang sia-sia.
            if (lastRadiusZoomRef.current === targetZoom) {
                pendingRadiusZoomRef.current = null;
                return;
            }

            pendingRadiusZoomRef.current = targetZoom;

            if (radiusZoomTimeoutRef.current) {
                clearTimeout(radiusZoomTimeoutRef.current);
            }

            radiusZoomTimeoutRef.current = setTimeout(() => {
                radiusZoomTimeoutRef.current = null;

                // Jangan timpa gesture user yang sedang aktif (pinch/scroll
                // zoom atau drag) — auto-zoom radius mengalah dan hanya
                // jalan kalau map sedang diam.
                if (isUserPanningRef.current) {
                    pendingRadiusZoomRef.current = null;
                    return;
                }

                if (isAutoMovingRef.current) {
                    if (!waitingForMoveEndRef.current) {
                        waitingForMoveEndRef.current = true;
                        const handleMoveEnd = () => {
                            waitingForMoveEndRef.current = false;
                            radiusMoveEndHandlerRef.current = null;

                            const nextZoom = pendingRadiusZoomRef.current;

                            if (nextZoom === null || isUserPanningRef.current) {
                                pendingRadiusZoomRef.current = null;

                                return;
                            }

                            pendingRadiusZoomRef.current = null;
                            lastRadiusZoomRef.current = nextZoom;
                            isAutoMovingRef.current = true;
                            map.flyTo(map.getCenter(), nextZoom, {
                                animate: true,
                                duration: 0.55,
                                easeLinearity: 0.2,
                            });
                        };

                        radiusMoveEndHandlerRef.current = handleMoveEnd;
                        map.once('moveend', handleMoveEnd);
                    }

                    return;
                }

                pendingRadiusZoomRef.current = null;
                lastRadiusZoomRef.current = targetZoom;
                isAutoMovingRef.current = true;

                // Ambil center TERBARU saat timeout benar-benar jalan
                // (bukan saat effect di-schedule) — supaya tidak flyTo ke
                // posisi basi kalau user sempat geser peta di antaranya.
                map.flyTo(map.getCenter(), targetZoom, {
                    animate: true,
                    duration: 0.55,
                    easeLinearity: 0.2,
                });
            }, 150);
        }
    }, [radiusKm, isMapReady, map, isAutoMovingRef, isUserPanningRef]);

    useEffect(() => {
        // Jangan flyTo sebelum peta siap — penyebab peta bergetar
        // (shimmer/shake) saat pertama kali dibuka.
        if (!coordinate || !isMapReady) {
            return;
        }

        const key = `${coordinate[0].toFixed(6)},${coordinate[1].toFixed(6)}`;

        // Jika ini adalah rendering pertama setelah map ready,
        // inisialisasi lastFlyToCoordRef dengan center peta saat ini untuk
        // menghindari flyTo redundant.
        if (lastFlyToCoordRef.current === null) {
            const center = map.getCenter();
            lastFlyToCoordRef.current = `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`;
            lastRadiusRef.current = radiusKm;
            lastRadiusZoomRef.current = map.getZoom();

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
            lastRadiusRef.current = radiusKm;
            lastRadiusZoomRef.current = zoomForRadius(radiusKm);
            isAutoMovingRef.current = true;

            // Batalkan auto-zoom radius yang mungkin masih pending —
            // koordinat baru yang datang akan menang.
            if (radiusZoomTimeoutRef.current) {
                clearTimeout(radiusZoomTimeoutRef.current);
                radiusZoomTimeoutRef.current = null;
            }

            // Saat flyTo dipicu oleh tombol locate (GPS), pakai
            // zoomForRadius(radiusKm) supaya lingkaran radius area
            // layanan ikut terlihat utuh di viewport. Untuk flyTo
            // lainnya (mis. pilih hasil pencarian), pertahankan zoom
            // user supaya gesture zoom tidak di-reset.
            const zoom = locateTriggeredRef.current
                ? zoomForRadius(radiusKm)
                : map.getZoom();
            locateTriggeredRef.current = false;

            map.stop();
            map.flyTo(coordinate, zoom, {
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
        radiusKm,
    ]);

    return null;
}
