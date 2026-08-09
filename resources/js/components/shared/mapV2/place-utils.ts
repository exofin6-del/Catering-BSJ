import type { GeoapifyFeature, PlaceFeature } from './types';

/* ============================================================================
 * Mapper
 * ========================================================================== */

export function mapGeoapifyFeature(feature: GeoapifyFeature): PlaceFeature {
    const p = feature.properties;

    const longitude = feature.geometry?.coordinates?.[0] ?? p.lon;
    const latitude = feature.geometry?.coordinates?.[1] ?? p.lat;

    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
        properties: {
            id: p.place_id ?? `${latitude}-${longitude}`,
            name: p.name ?? p.formatted ?? 'Lokasi',
            formatted: p.formatted ?? '',
            street: p.street,
            housenumber: p.housenumber,
            neighbourhood: p.neighbourhood,
            hamlet: p.hamlet,
            village: p.village,
            suburb: p.suburb,
            district: p.district,
            city: p.city,
            county: p.county,
            state: p.state,
            postcode: p.postcode,
            country: p.country,
            category: p.categories?.[0],
        },
    };
}

export function mapGeoapifyFeatures(
    features: GeoapifyFeature[],
): PlaceFeature[] {
    return features.map(mapGeoapifyFeature);
}

/* ============================================================================
 * Formatter
 * ========================================================================== */

export function formatAddress(place: PlaceFeature): string {
    const p = place.properties;

    // Susun alamat dari komponen administratif mengikuti struktur
    // Indonesia: nama tempat (POI), jalan, RT/RW, dusun, desa/kelurahan,
    // kecamatan, kota/kabupaten, provinsi — alih-alih memakai `formatted`
    // bawaan Geoapify yang sering memuat nama POI terdekat.
    //
    // Nama tempat (p.name) disertakan bila bukan placeholder generik
    // ("Lokasi") sehingga tempat khusus seperti "Kantor Kelurahan
    // Gedongan" tetap tampil di alamat.
    const streetLine = [p.street, p.housenumber]
        .filter((part): part is string => Boolean(part && part.trim() !== ''))
        .join(' No. ');

    const meaningfulName =
        p.name && p.name.trim() !== '' && p.name !== 'Lokasi'
            ? p.name
            : undefined;

    const parts = [
        meaningfulName,
        streetLine || undefined,
        p.neighbourhood,
        p.hamlet,
        p.village,
        p.suburb,
        p.district,
        p.city ?? p.county,
        p.state,
        p.postcode,
    ];

    const composed = dedupeAddressParts(parts).join(', ');

    if (composed) {
        return composed;
    }

    // Fallback ke formatted bawaan bila komponen administratif kosong.
    return p.formatted || '';
}

/**
 * Menghapus bagian alamat yang kosong, duplikat (case-insensitive),
 * atau substring dari bagian lain — mencegah "Gedongan" muncul
 * terpisah bila sudah ada di "Kantor Kelurahan Gedongan", atau
 * "Surakarta" dobel bila Geoapify mengisi `city` dan `county` sama.
 */
function dedupeAddressParts(parts: (string | undefined)[]): string[] {
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

    return result;
}

/* ============================================================================
 * Title
 * ========================================================================== */

export function displayPlaceTitle(place: PlaceFeature): string {
    const p = place.properties;

    if (p.name && p.name.trim() !== '' && p.name !== 'Lokasi') {
        return p.name;
    }

    if (p.street) {
        return [p.street, p.housenumber].filter(Boolean).join(' No. ');
    }

    return p.name || p.formatted || 'Lokasi';
}

/* ============================================================================
 * Subtitle
 * ========================================================================== */

export function displayPlaceArea(place: PlaceFeature): string {
    const p = place.properties;

    if (
        p.neighbourhood ||
        p.hamlet ||
        p.village ||
        p.suburb ||
        p.district ||
        p.city ||
        p.state
    ) {
        const locality = [p.neighbourhood, p.hamlet, p.village, p.suburb]
            .filter(Boolean)
            .join(', ');

        const area = [p.district, p.city, p.state].filter(Boolean).join(', ');

        if (locality && area) {
            return `${locality}, ${area}`;
        }

        return locality || area || '';
    }

    return '';
}

/* ============================================================================
 * Duplicate
 * ========================================================================== */

export function dedupePlaces(places: PlaceFeature[]): PlaceFeature[] {
    const seen = new Set<string>();

    return places.filter((place) => {
        const key = place.properties.id || place.geometry.coordinates.join(',');

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);

        return true;
    });
}

/* ============================================================================
 * Filter
 * ========================================================================== */

export function removeUnnamedPlaces(places: PlaceFeature[]): PlaceFeature[] {
    return places.filter((place) => place.properties.name.trim().length > 0);
}
