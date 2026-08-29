import { nearbyPlaces } from './geoapify';
import {
    GeoapifyApiKey,
    GeoapifyReverseGeocodingEndpoint,
    formatCoordinate,
} from './location-utils';
import { dedupePlaces, mapGeoapifyFeatures } from './place-utils';
import type { Coordinate } from './types';

/* ============================================================================
 * Types
 * ========================================================================== */

export type NearbyResult = {
    id: string;
    name: string;
    address: string;
    category: string;
    coordinate: { latitude: number; longitude: number };
    distance?: number;
    street?: string;
    housenumber?: string;
    suburb?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
};

interface NearbyOptions {
    radius?: number;
    limit?: number;
}

/* ============================================================================
 * Helpers
 * ========================================================================== */

function calculateDistance(
    a: Coordinate,
    b: { latitude: number; longitude: number },
): number {
    const R = 6_371_000;
    const toRad = (v: number) => (v * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

async function fetchReverseGeocodeNearby(
    coordinate: [number, number],
    limit = 15,
): Promise<any[]> {
    if (!GeoapifyApiKey) {
        return [];
    }

    const [latitude, longitude] = coordinate;
    const parameters = new URLSearchParams({
        lat: formatCoordinate(latitude),
        lon: formatCoordinate(longitude),
        apiKey: GeoapifyApiKey,
        lang: 'id',
        limit: String(limit),
        format: 'json',
    });

    try {
        const response = await fetch(
            `${GeoapifyReverseGeocodingEndpoint}?${parameters.toString()}`,
        );

        if (!response.ok) {
            return [];
        }

        const data = await response.json();

        return data.results || data.features || [];
    } catch {
        return [];
    }
}

/**
 * Menyusun alamat dari komponen administratif Geoapify mengikuti
 * struktur Indonesia: nama tempat (POI), jalan, RT/RW, dusun,
 * desa/kelurahan, kecamatan, kota/kabupaten, provinsi.
 *
 * Nama tempat (`prop.name`) disertakan bila bukan placeholder generik
 * ("Lokasi"/"Location") sehingga tempat khusus seperti "Kantor
 * Kelurahan Gedongan" tetap tampil di alamat. Mengembalikan string
 * kosong bila tidak ada komponen yang tersedia.
 */
function composeAdministrativeAddress(
    prop: {
        name?: string;
        street?: string;
        housenumber?: string;
        neighbourhood?: string;
        hamlet?: string;
        village?: string;
        suburb?: string;
        district?: string;
        city?: string;
        county?: string;
        state?: string;
        postcode?: string;
    },
    streetLine?: string,
): string {
    const meaningfulName =
        prop.name &&
        prop.name.trim() !== '' &&
        prop.name !== 'Lokasi' &&
        prop.name !== 'Location'
            ? prop.name
            : undefined;

    const parts = [
        meaningfulName,
        streetLine,
        prop.neighbourhood,
        prop.hamlet,
        prop.village,
        prop.suburb,
        prop.district,
        prop.city ?? prop.county,
        prop.state,
        prop.postcode,
    ];

    const result: string[] = [];

    for (const part of parts) {
        if (!part || part.trim() === '') {
            continue;
        }

        const trimmed = part.trim();
        const lower = trimmed.toLowerCase();

        // Skip jika exact match atau substring dari bagian yang sudah ada
        const isDuplicate = result.some((existing) => {
            const existingLower = existing.toLowerCase();

            return (
                existingLower === lower ||
                existingLower.includes(lower) ||
                lower.includes(existingLower)
            );
        });

        if (!isDuplicate) {
            result.push(trimmed);
        }
    }

    return result.join(', ');
}

/* ============================================================================
 * getNearbyLocations
 * ========================================================================== */

export async function getNearbyLocations(
    coordinate: Coordinate,
    options: NearbyOptions = {},
): Promise<NearbyResult[]> {
    const limit = options.limit ?? 15;
    // Set radius to a close value (e.g. 400 meters) so POIs are actually nearby
    const radius = options.radius ?? 400;

    const [geoapifyResponse, reverseResponse] = await Promise.all([
        nearbyPlaces(coordinate, radius, limit),
        fetchReverseGeocodeNearby(
            [coordinate.latitude, coordinate.longitude],
            limit,
        ),
    ]);

    // 1. Map POIs from Places API
    const places = dedupePlaces(
        mapGeoapifyFeatures(geoapifyResponse.features ?? []),
    );

    const basePlaces: NearbyResult[] = places.map((p) => ({
        id: p.properties.id,
        name: p.properties.name,
        address: p.properties.formatted,
        category: p.properties.category ?? 'place',
        coordinate: {
            latitude: p.geometry.coordinates[1],
            longitude: p.geometry.coordinates[0],
        },
        distance: calculateDistance(coordinate, {
            latitude: p.geometry.coordinates[1],
            longitude: p.geometry.coordinates[0],
        }),
    }));

    const normalizedPlaces: NearbyResult[] = basePlaces.map((p, idx) => {
        const origPlace = places[idx];
        const prop = origPlace?.properties;

        if (!prop) {
            return p;
        }

        const streetLine = prop.street
            ? [prop.street, prop.housenumber ? `No. ${prop.housenumber}` : '']
                  .filter(Boolean)
                  .join(' ')
            : undefined;

        const address = composeAdministrativeAddress(prop, streetLine);

        return {
            ...p,
            name:
                p.name && p.name !== 'Lokasi' && p.name !== prop.formatted
                    ? p.name
                    : prop.street
                      ? `${prop.street}${prop.housenumber ? ` No. ${prop.housenumber}` : ''}`
                      : 'Lokasi',
            address: address || p.address || '',
            street: prop.street,
            housenumber: prop.housenumber,
            suburb: prop.suburb,
            district: prop.district,
            city: prop.city,
            state: prop.state,
            postcode: prop.postcode,
        };
    });

    // 2. Map reverse geocoding results (streets, gangs, houses, very close points)
    // Only include if there's an actual place name, otherwise use
    // desa/kelurahan, kecamatan, kota/kabupaten, provinsi format.
    const reversePlaces: NearbyResult[] = reverseResponse.map((r: any) => {
        const prop = r.properties || r;
        const coords = r.geometry?.coordinates || [r.lon, r.lat];

        const streetLine = prop.street
            ? [prop.street, prop.housenumber ? `No. ${prop.housenumber}` : '']
                  .filter(Boolean)
                  .join(' ')
            : undefined;

        const address = composeAdministrativeAddress(prop, streetLine);

        // Don't force name from street unless there's an actual place name
        let name = prop.name;

        if (!name || name === 'Lokasi' || name === 'Location') {
            // Susun nama dari wilayah administratif: dusun, desa/kelurahan,
            // kecamatan, kota/kabupaten, provinsi — urutan granular ke luas,
            // konsisten dengan formatAddressFromComponents/formatAddress.
            const parts = [
                prop.hamlet,
                prop.village,
                prop.suburb,
                prop.district,
                prop.city ?? prop.county,
                prop.state,
            ];
            const filtered = parts.filter((part): part is string =>
                Boolean(part && part.trim() !== ''),
            );

            if (filtered.length > 0) {
                name = filtered.join(', ');
            } else if (streetLine) {
                name = streetLine;
            } else {
                name = 'Lokasi';
            }
        }

        return {
            id: prop.place_id || `${coords[1]}-${coords[0]}`,
            name: name,
            address: address || prop.formatted || '',
            category: prop.result_type || 'address',
            coordinate: {
                latitude: coords[1],
                longitude: coords[0],
            },
            distance: calculateDistance(coordinate, {
                latitude: coords[1],
                longitude: coords[0],
            }),
            street: prop.street,
            housenumber: prop.housenumber,
            suburb: prop.suburb,
            district: prop.district,
            city: prop.city,
            state: prop.state,
            postcode: prop.postcode,
        };
    });

    // 3. Remove places at or very near the selected/current location so they don't show as suggestions
    const filteredReversePlaces = reversePlaces.filter(
        (place) => calculateDistance(coordinate, place.coordinate) > 5,
    );

    const filteredNormalizedPlaces = normalizedPlaces.filter(
        (place) => calculateDistance(coordinate, place.coordinate) > 5,
    );

    const merged = [...filteredReversePlaces, ...filteredNormalizedPlaces];

    const coordMap = new Map<string, NearbyResult>();

    for (const item of merged) {
        // Create coordinate key rounded to 4 decimals (~11m resolution)
        const coordKey = `${item.coordinate.latitude.toFixed(4)},${item.coordinate.longitude.toFixed(4)}`;
        const existing = coordMap.get(coordKey);

        if (!existing) {
            coordMap.set(coordKey, item);
        } else {
            const existingName = existing.name.toLowerCase().trim();
            const currentName = item.name.toLowerCase().trim();

            const isExistingGeneric =
                existingName === 'lokasi' ||
                existingName === 'current location' ||
                existingName === 'lokasi terpilih';
            const isCurrentGeneric =
                currentName === 'lokasi' ||
                currentName === 'current location' ||
                currentName === 'lokasi terpilih';

            const isExistingRoad =
                existingName.startsWith('jl') ||
                existingName.startsWith('jalan') ||
                existingName.startsWith('gang');
            const isCurrentRoad =
                currentName.startsWith('jl') ||
                currentName.startsWith('jalan') ||
                currentName.startsWith('gang');

            let selectCurrent = false;

            if (isExistingGeneric && !isCurrentGeneric) {
                selectCurrent = true;
            } else if (!isExistingGeneric && !isCurrentGeneric) {
                if (isExistingRoad && !isCurrentRoad) {
                    selectCurrent = true;
                } else if (!isExistingRoad && !isCurrentRoad) {
                    if (item.name.length > existing.name.length) {
                        selectCurrent = true;
                    }
                }
            }

            if (selectCurrent) {
                coordMap.set(coordKey, item);
            }
        }
    }

    const deduped = Array.from(coordMap.values());

    return deduped
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, limit);
}
