import type { Coordinate, PlaceFeature } from './types';

/* ============================================================================
 * Earth
 * ========================================================================== */

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (value: number): number => (value * Math.PI) / 180;

/* ============================================================================
 * Distance
 * ========================================================================== */

export function distanceMetersBetween(
    first: Coordinate,
    second: Coordinate,
): number {
    const lat1 = toRadians(first.latitude);
    const lat2 = toRadians(second.latitude);

    const deltaLat = toRadians(second.latitude - first.latitude);
    const deltaLng = toRadians(second.longitude - first.longitude);

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}

/* ============================================================================
 * Sort
 * ========================================================================== */

export function sortPlacesByDistance(
    origin: Coordinate,
    places: PlaceFeature[],
): PlaceFeature[] {
    return [...places].sort((a, b) => {
        const distanceA = distanceMetersBetween(origin, {
            latitude: a.geometry.coordinates[1],
            longitude: a.geometry.coordinates[0],
        });

        const distanceB = distanceMetersBetween(origin, {
            latitude: b.geometry.coordinates[1],
            longitude: b.geometry.coordinates[0],
        });

        return distanceA - distanceB;
    });
}

/* ============================================================================
 * Attach distance
 * ========================================================================== */

export function withPlaceDistances(
    origin: Coordinate,
    places: PlaceFeature[],
): PlaceFeature[] {
    return places.map((place) => ({
        ...place,
        properties: {
            ...place.properties,
            distanceMeters: distanceMetersBetween(origin, {
                latitude: place.geometry.coordinates[1],
                longitude: place.geometry.coordinates[0],
            }),
        },
    }));
}

/* ============================================================================
 * Radius Filter
 * ========================================================================== */

export function filterPlacesWithinRadius(
    origin: Coordinate,
    places: PlaceFeature[],
    radiusMeters: number,
): PlaceFeature[] {
    return places.filter((place) => {
        const distance = distanceMetersBetween(origin, {
            latitude: place.geometry.coordinates[1],
            longitude: place.geometry.coordinates[0],
        });

        return distance <= radiusMeters;
    });
}
