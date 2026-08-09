import type { CustomerBusiness } from '../types/customer-storefront-types';

export type BusinessCoordinate = {
    latitude: number;
    longitude: number;
};

export function customerBusinessCoordinate(
    business: Pick<CustomerBusiness, 'latitude' | 'longitude'>,
): BusinessCoordinate | null {
    const latitude = Number(business.latitude);
    const longitude = Number(business.longitude);

    if (
        business.latitude === null ||
        business.longitude === null ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        return null;
    }

    return { latitude, longitude };
}

export function customerGoogleMapsEmbedUrl(
    coordinate: BusinessCoordinate,
): string {
    const query = encodeURIComponent(
        `${coordinate.latitude},${coordinate.longitude}`,
    );

    return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
}

export function customerGoogleMapsDirectionsUrl(
    coordinate: BusinessCoordinate,
): string {
    const destination = encodeURIComponent(
        `${coordinate.latitude},${coordinate.longitude}`,
    );

    return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
