import type { PlaceFeature } from '@/components/ui/place-autocomplete';

export type Coordinate = [number, number];

export const SurakartaCoordinate: Coordinate = [-7.5666, 110.8167];

export const MaximumCurrentLocationAccuracyMeters = 250;

export const NominatimSearchEndpoint =
    'https://nominatim.openstreetmap.org/search';
export const NominatimReverseEndpoint =
    'https://nominatim.openstreetmap.org/reverse';

export function coordinateFromValues(
    latitudeValue: unknown,
    longitudeValue: unknown,
): Coordinate | null {
    const latitude = numericCoordinate(latitudeValue);
    const longitude = numericCoordinate(longitudeValue);

    if (
        latitude === null ||
        longitude === null ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null;
    }

    return [latitude, longitude];
}

export function coordinateKey([latitude, longitude]: Coordinate): string {
    return `${formatCoordinate(latitude)},${formatCoordinate(longitude)}`;
}

export function formatCoordinate(value: number): string {
    return value.toFixed(7);
}

export function buildGoogleMapsDirectionsUrl({
    addressName,
    coordinate,
    eventAddress,
}: {
    addressName: string;
    coordinate: Coordinate | null;
    eventAddress: string;
}): string | null {
    const destination = coordinate
        ? `${coordinate[0]},${coordinate[1]}`
        : [addressName, eventAddress].filter(Boolean).join(', ');

    if (!destination) {
        return null;
    }

    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

export function formatDistance(distanceMeters: number): string {
    if (distanceMeters < 1000) {
        return `${Math.max(1, Math.round(distanceMeters))} m`;
    }

    return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export async function reverseGeocodeCoordinate(
    coordinate: Coordinate,
    signal?: AbortSignal,
): Promise<string | null> {
    const parameters = new URLSearchParams({
        addressdetails: '1',
        format: 'jsonv2',
        lat: formatCoordinate(coordinate[0]),
        lon: formatCoordinate(coordinate[1]),
        zoom: '18',
    });

    const response = await fetch(
        `${NominatimReverseEndpoint}?${parameters.toString()}`,
        {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'AdminCateringApp/1.0 (order-location-command)',
            },
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('Reverse geocoding failed.');
    }

    const payload: unknown = await response.json();

    return isNominatimReverseResult(payload)
        ? payload.display_name.trim()
        : null;
}

export async function reverseGeocodeLocationLabel(
    coordinate: Coordinate,
    signal?: AbortSignal,
): Promise<string | null> {
    const parameters = new URLSearchParams({
        addressdetails: '1',
        format: 'jsonv2',
        lat: formatCoordinate(coordinate[0]),
        lon: formatCoordinate(coordinate[1]),
        zoom: '18',
    });

    const response = await fetch(
        `${NominatimReverseEndpoint}?${parameters.toString()}`,
        {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'AdminCateringApp/1.0 (order-location-command)',
            },
            signal,
        },
    );

    if (!response.ok) {
        throw new Error('Reverse geocoding failed.');
    }

    const payload: unknown = await response.json();

    if (!isNominatimReverseResult(payload)) {
        return null;
    }

    const payloadWithAddress = payload as {
        address?: Record<string, string | undefined>;
        display_name?: string;
    };
    const address = payloadWithAddress.address ?? {};
    const labelParts = [
        address.road,
        address.pedestrian,
        address.residential,
        address.suburb,
        address.neighbourhood,
        address.village,
        address.hamlet,
        address.town,
        address.city_district,
        address.city,
        address.county,
        address.state_district,
        address.state,
    ].filter((value): value is string => Boolean(value));

    if (labelParts.length > 0) {
        const [first, second] = labelParts;

        return second ? `${first}, ${second}` : first;
    }

    return payload.display_name.split(',').slice(0, 2).join(', ').trim();
}

export function haversineDistanceMeters(
    [originLatitude, originLongitude]: Coordinate,
    [destinationLatitude, destinationLongitude]: Coordinate,
): number {
    const earthRadiusMeters = 6371000;
    const latitudeDelta = degreesToRadians(
        destinationLatitude - originLatitude,
    );
    const longitudeDelta = degreesToRadians(
        destinationLongitude - originLongitude,
    );
    const originLatitudeRadians = degreesToRadians(originLatitude);
    const destinationLatitudeRadians = degreesToRadians(destinationLatitude);
    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(originLatitudeRadians) *
            Math.cos(destinationLatitudeRadians) *
            Math.sin(longitudeDelta / 2) ** 2;

    return (
        earthRadiusMeters *
        2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
}

function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function numericCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const coordinate = Number(value);

    return Number.isFinite(coordinate) ? coordinate : null;
}

function isNominatimReverseResult(
    result: unknown,
): result is { display_name: string } {
    if (!result || typeof result !== 'object') {
        return false;
    }

    const candidate = result as { display_name?: string };

    return (
        typeof candidate.display_name === 'string' &&
        candidate.display_name.trim() !== ''
    );
}

export function sortPlacesByDistance(
    features: PlaceFeature[],
    origin: Coordinate,
): PlaceFeature[] {
    return [...features].sort(
        (firstFeature, secondFeature) =>
            distanceMetersBetween(origin, firstFeature) -
            distanceMetersBetween(origin, secondFeature),
    );
}

export function distanceMetersBetween(
    origin: Coordinate,
    feature: PlaceFeature,
): number {
    const [featureLongitude, featureLatitude] = feature.geometry.coordinates;

    return haversineDistanceMeters(origin, [featureLatitude, featureLongitude]);
}

export function dedupePlaces(features: PlaceFeature[]): PlaceFeature[] {
    const placeIds = new Set<string>();

    return features.filter((feature) => {
        const { osm_id: osmId, osm_type: osmType } = feature.properties;
        const placeId =
            osmId && osmType
                ? `${osmType}-${osmId}`
                : [
                      feature.geometry.coordinates.join(','),
                      feature.properties.name,
                      feature.properties.street,
                  ]
                      .filter(Boolean)
                      .join('-');

        if (placeIds.has(placeId)) {
            return false;
        }

        placeIds.add(placeId);

        return true;
    });
}

export function displayPlaceTitle(feature: PlaceFeature): string {
    return feature.properties.name || feature.properties.street || 'Lokasi';
}

export function displayPlaceArea(feature: PlaceFeature): string | null {
    return (
        feature.properties.city ||
        feature.properties.locality ||
        feature.properties.county ||
        feature.properties.state ||
        null
    );
}
