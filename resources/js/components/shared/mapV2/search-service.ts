import { searchCache } from './cache';
import { searchPlaceCoordinates } from './geoapify';
import { mapGeoapifyFeatures } from './place-utils';
import type { Coordinate, PlaceFeature } from './types';

const DEFAULT_LIMIT = 10;

function createCacheKey(query: string, origin?: Coordinate): string {
    const normalized = query.trim().toLowerCase();

    if (!origin) {
        return normalized;
    }

    return [
        normalized,
        origin.latitude.toFixed(5),
        origin.longitude.toFixed(5),
    ].join(':');
}

export async function searchPlaces(
    query: string,
    options?: {
        origin?: Coordinate;
        limit?: number;
        signal?: AbortSignal;
    },
): Promise<PlaceFeature[]> {
    const normalized = query.trim();

    if (!normalized) {
        return [];
    }

    const cacheKey = createCacheKey(normalized, options?.origin);

    const cached = searchCache.get(cacheKey);

    if (cached) {
        return cached;
    }

    const response = await searchPlaceCoordinates(
        normalized,
        options?.origin,
        options?.limit ?? DEFAULT_LIMIT,
        options?.signal,
    );

    const places = mapGeoapifyFeatures(response.features ?? []);

    searchCache.set(cacheKey, places);

    return places;
}

export function clearSearchCache() {
    searchCache.clear();
}
