import { GeoapifyApiKey } from './location-utils';
import type {
    GeoapifyAutocompleteResponse,
    GeoapifyPlacesResponse,
    Coordinate,
} from './types';

const AUTOCOMPLETE_ENDPOINT =
    'https://api.geoapify.com/v1/geocode/autocomplete';

const SEARCH_ENDPOINT = 'https://api.geoapify.com/v1/geocode/search';

const PLACES_ENDPOINT = 'https://api.geoapify.com/v2/places';

const DEFAULT_TIMEOUT = 10000;

export const DEFAULT_NEARBY_CATEGORIES = [
    'commercial',
    'service',
    'catering',
    'education',
    'healthcare',
    'tourism',
    'accommodation',
    'building',
    'parking',
    'public_transport',
    'religion',
    'sport',
    'entertainment',
    'leisure',
    'office',
    'amenity',
    'administrative',
].join(',');

async function fetchJson<T>(url: URL, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, DEFAULT_TIMEOUT);

    try {
        const response = await fetch(url.toString(), {
            signal: signal ?? controller.signal,
            headers: {
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Geoapify request failed (${response.status})`);
        }

        return (await response.json()) as T;
    } finally {
        clearTimeout(timeout);
    }
}

/* ==============================================================
 * AUTOCOMPLETE
 * ============================================================ */

export async function autocompletePlaces(
    query: string,
    origin?: Coordinate,
    limit = 10,
    signal?: AbortSignal,
): Promise<GeoapifyAutocompleteResponse> {
    const url = new URL(AUTOCOMPLETE_ENDPOINT);

    url.searchParams.set('text', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('lang', 'id');
    url.searchParams.set('filter', 'countrycode:id');

    if (origin) {
        url.searchParams.set(
            'bias',
            `proximity:${origin.longitude},${origin.latitude}`,
        );
    }

    url.searchParams.set('apiKey', GeoapifyApiKey);

    return fetchJson(url, signal);
}

export async function searchPlaceCoordinates(
    query: string,
    origin?: Coordinate,
    limit = 5,
    signal?: AbortSignal,
): Promise<GeoapifyAutocompleteResponse> {
    const url = new URL(SEARCH_ENDPOINT);

    url.searchParams.set('text', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('lang', 'id');
    url.searchParams.set('filter', 'countrycode:id');

    // Use 'proximity' to prefer results near origin for address searches
    if (origin) {
        url.searchParams.set(
            'bias',
            `proximity:${origin.longitude},${origin.latitude}`,
        );
    }

    url.searchParams.set('apiKey', GeoapifyApiKey);

    return fetchJson(url, signal);
}

/* ==============================================================
 * NEARBY
 * ============================================================ */

export async function nearbyPlaces(
    center: Coordinate,
    radius = 500,
    limit = 20,
    signal?: AbortSignal,
): Promise<GeoapifyPlacesResponse> {
    const url = new URL(PLACES_ENDPOINT);

    url.searchParams.set(
        'filter',
        `circle:${center.longitude},${center.latitude},${radius}`,
    );

    url.searchParams.set(
        'bias',
        `proximity:${center.longitude},${center.latitude}`,
    );

    url.searchParams.set('categories', DEFAULT_NEARBY_CATEGORIES);

    url.searchParams.set('limit', String(limit));

    url.searchParams.set('lang', 'id');

    url.searchParams.set('apiKey', GeoapifyApiKey);

    return fetchJson(url, signal);
}
