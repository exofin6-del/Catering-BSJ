/* ============================================================================
 * Shared map types
 * ========================================================================== */

export type Coordinate = {
    latitude: number;
    longitude: number;
};

export type BoundingBox = {
    north: number;
    south: number;
    east: number;
    west: number;
};

export type GeoapifyFeature = {
    type: 'Feature';
    properties: {
        place_id?: string;

        name?: string;
        formatted?: string;

        housenumber?: string;
        street?: string;

        neighbourhood?: string;
        hamlet?: string;
        village?: string;
        suburb?: string;
        district?: string;
        city?: string;
        county?: string;
        state?: string;

        postcode?: string;
        country?: string;
        country_code?: string;

        lat: number;
        lon: number;

        result_type?: string;
        categories?: string[];
    };

    geometry: {
        type: 'Point';
        coordinates: [number, number];
    };
};

export type GeoapifyAutocompleteResponse = {
    type: 'FeatureCollection';
    features: GeoapifyFeature[];
};

export type GeoapifyPlacesResponse = {
    type: 'FeatureCollection';
    features: GeoapifyFeature[];
};

/* ============================================================================
 * Internal PlaceFeature
 * ========================================================================== */

export type PlaceGeometry = {
    type: 'Point';
    coordinates: [number, number];
};

export type PlaceProperties = {
    id: string;

    name: string;

    formatted: string;

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
    country?: string;

    category?: string;

    distanceMeters?: number;
};

export type PlaceFeature = {
    type: 'Feature';
    geometry: PlaceGeometry;
    properties: PlaceProperties;
};

/* ============================================================================
 * Search
 * ========================================================================== */

export type SearchOptions = {
    origin?: Coordinate;
    limit?: number;
};

export type NearbySearchOptions = {
    center: Coordinate;

    radiusMeters?: number;

    limit?: number;
};

/* ============================================================================
 * Cache
 * ========================================================================== */

export type CacheEntry<T> = {
    timestamp: number;

    value: T;
};

/* ============================================================================
 * Reverse Geocode
 * ========================================================================== */

export type ReverseGeocodeResult = {
    coordinate: Coordinate;

    formattedAddress: string;

    street?: string;

    district?: string;

    city?: string;

    state?: string;

    postcode?: string;

    country?: string;
};
