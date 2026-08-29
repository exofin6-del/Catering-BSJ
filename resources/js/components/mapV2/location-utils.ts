export type Coordinate = [number, number];

export const SurakartaCoordinate: Coordinate = [-7.5666, 110.8167];

export const MaximumCurrentLocationAccuracyMeters = 500;

// Geoapify Reverse Geocoding API.
// Docs: https://apidocs.geoapify.com/docs/geocoding/reverse-geocoding/
export const GeoapifyReverseGeocodingEndpoint =
    'https://api.geoapify.com/v1/geocode/reverse';

/**
 * API key Geoapify diambil dari environment variable.
 * Pastikan VITE_GEOAPIFY_API_KEY sudah diisi di file .env.local atau .env
 */
export const GeoapifyApiKey = import.meta.env.VITE_GEOAPIFY_API_KEY ?? '';

/**
 * Nominatim (OpenStreetMap) dipakai sebagai sumber KEDUA, hanya untuk
 * mengisi celah level administratif (dusun/desa/kabupaten) yang kadang
 * tidak dikembalikan Geoapify untuk area yang datanya kurang lengkap di
 * OSM. Gratis, tanpa API key, tapi terikat kebijakan penggunaan wajar
 * (maks. ~1 req/detik) — lihat https://operations.osmfoundation.org/policies/nominatim/.
 * Untuk trafik besar sebaiknya di-proxy lewat backend + cache sendiri.
 */
export const NominatimReverseGeocodingEndpoint =
    'https://nominatim.openstreetmap.org/reverse';

const ReverseGeocodeCacheDurationMs = 10 * 60 * 1_000;
const ReverseGeocodeCacheMaximumEntries = 100;

/**
 * Geoapify reverse-geocoding tidak selalu punya data persis di titik yang
 * diminta — ia bisa mengembalikan POI/bangunan terdekat yang tersedia di
 * data OSM meskipun jaraknya cukup jauh dari koordinat asli (field
 * `distance` pada response menunjukkan seberapa jauh). Tanpa ambang batas
 * ini, nama POI tersebut (mis. nama toko/gedung tetangga) bisa "nyangkut"
 * jadi alamat titik yang sebenarnya beda lokasi. Nama POI/bangunan hanya
 * dipakai bila hasil match berada dalam radius ini dari titik asli.
 */
const MaximumPoiNameMatchDistanceMeters = 50;

/**
 * Ambang untuk komponen level jalan (nama jalan/nomor rumah). Sedikit
 * lebih longgar dari ambang POI karena jalan mencakup area lebih luas,
 * tapi tetap dibatasi supaya jalan dari bangunan yang jauh tidak ikut
 * "menempel" ke titik yang sebenarnya sudah beda blok/gang.
 */
const MaximumStreetMatchDistanceMeters = 150;

export type ReverseGeocodedAddress = {
    address: string | null;
    components: ReverseGeocodedAddressComponents | null;
    /** Perkiraan tingkat presisi hasil, diturunkan dari result_type & kelengkapan komponen. */
    precision: 'building' | 'street' | 'area' | 'region' | 'unknown';
};

export type ReverseGeocodedAddressComponents = {
    houseNumber?: string;
    road?: string;
    name?: string;

    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    suburb?: string;

    city?: string;
    district?: string;
    regency?: string;
    postcode?: string;
    state?: string;
    country?: string;
};

const reverseGeocodeCache = new Map<
    string,
    { result: ReverseGeocodedAddress; expiresAt: number }
>();
const reverseGeocodeRequests = new Map<
    string,
    Promise<ReverseGeocodedAddress>
>();

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
    const result = await reverseGeocodeCoordinateDetails(coordinate, signal);

    return result.address;
}

export async function reverseGeocodeCoordinateDetails(
    coordinate: Coordinate,
    signal?: AbortSignal,
): Promise<ReverseGeocodedAddress> {
    const cacheKey = coordinateKey(coordinate);
    const cachedResult = reverseGeocodeCache.get(cacheKey);

    if (cachedResult && cachedResult.expiresAt > Date.now()) {
        return cachedResult.result;
    }

    if (!signal) {
        const inFlightRequest = reverseGeocodeRequests.get(cacheKey);

        if (inFlightRequest) {
            return inFlightRequest;
        }
    }

    const request = fetchReverseGeocodeCoordinate(coordinate, signal);

    if (signal) {
        return request;
    }

    reverseGeocodeRequests.set(cacheKey, request);

    try {
        return await request;
    } finally {
        reverseGeocodeRequests.delete(cacheKey);
    }
}

async function fetchReverseGeocodeCoordinate(
    coordinate: Coordinate,
    signal?: AbortSignal,
): Promise<ReverseGeocodedAddress> {
    if (!GeoapifyApiKey) {
        throw new Error(
            'Geoapify API key belum diisi. Ambil di https://myprojects.geoapify.com/',
        );
    }

    const [latitude, longitude] = coordinate;

    const parameters = new URLSearchParams({
        lat: formatCoordinate(latitude),
        lon: formatCoordinate(longitude),
        apiKey: GeoapifyApiKey,
        lang: 'id',
        format: 'json',
    });

    const response = await fetch(
        `${GeoapifyReverseGeocodingEndpoint}?${parameters.toString()}`,
        { signal },
    );

    if (!response.ok) {
        throw new Error('Reverse geocoding failed.');
    }

    const payload: unknown = await response.json();

    let result: ReverseGeocodedAddress;

    const properties = firstGeoapifyResultProperties(payload);

    if (properties) {
        let components = geoapifyAddressComponents(properties);

        // Geoapify kadang tidak punya data dusun/desa/kabupaten untuk area
        // tertentu meski kecamatan & provinsi ada. Isi celah itu dari
        // Nominatim — jangan menimpa field yang sudah terisi dari Geoapify,
        // hanya melengkapi yang kosong.
        if (isMissingAdminHierarchy(components)) {
            const nominatimComponents = await fetchNominatimComponents(
                coordinate,
                signal,
            );

            if (nominatimComponents) {
                components = fillMissingComponents(
                    components,
                    nominatimComponents,
                );
            }
        }

        const composedAddress =
            formatAddressFromComponents(components) ||
            (typeof properties.formatted === 'string'
                ? properties.formatted
                : null);

        result = {
            address: composedAddress,
            components,
            precision: precisionFromComponents(components, properties),
        };
    } else {
        result = { address: null, components: null, precision: 'unknown' };
    }

    cacheReverseGeocodeResult(coordinateKey(coordinate), result);

    return result;
}

/**
 * Cek apakah komponen administratif inti (dusun/desa/kabupaten) masih
 * kosong — jadi kandidat untuk dilengkapi dari sumber kedua (Nominatim).
 * Kecamatan & provinsi sengaja tidak dicek karena Geoapify hampir selalu
 * punya data itu; yang sering hilang justru level di bawah & di atasnya.
 */
function isMissingAdminHierarchy(
    components: ReverseGeocodedAddressComponents,
): boolean {
    const hasVillageLevel = Boolean(
        components.hamlet || components.village || components.suburb,
    );
    const hasRegencyLevel = Boolean(components.city || components.regency);

    return !hasVillageLevel || !hasRegencyLevel;
}

/**
 * Mengambil komponen alamat dari Nominatim (OpenStreetMap) untuk satu
 * koordinat. Hanya dipakai sebagai pelengkap, jadi kegagalan di sini
 * tidak boleh menggagalkan keseluruhan reverse-geocode — selalu
 * kembalikan `null` pada error, jangan throw.
 */
async function fetchNominatimComponents(
    coordinate: Coordinate,
    signal?: AbortSignal,
): Promise<Partial<ReverseGeocodedAddressComponents> | null> {
    try {
        const [latitude, longitude] = coordinate;

        const parameters = new URLSearchParams({
            format: 'jsonv2',
            lat: formatCoordinate(latitude),
            lon: formatCoordinate(longitude),
            addressdetails: '1',
            'accept-language': 'id',
            zoom: '18',
        });

        const response = await fetch(
            `${NominatimReverseGeocodingEndpoint}?${parameters.toString()}`,
            { signal },
        );

        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as {
            address?: NominatimAddress;
        };

        const address = payload.address;

        if (!address) {
            return null;
        }

        return {
            houseNumber: address.house_number,
            road: address.road,
            neighbourhood: address.neighbourhood,
            hamlet: address.hamlet,
            village: address.village,
            suburb: address.suburb ?? address.city_district,
            district: address.city_district ?? address.suburb,
            city: address.city ?? address.town ?? address.municipality,
            regency: address.county,
            postcode: address.postcode,
            state: address.state,
            country: address.country,
        };
    } catch {
        // Jaringan gagal / di-abort — anggap saja tidak ada data tambahan.
        return null;
    }
}

/**
 * Isi field yang kosong di `primary` (Geoapify) dengan nilai dari
 * `secondary` (Nominatim). Field yang sudah terisi di primary TIDAK
 * pernah ditimpa — Geoapify tetap sumber utama, Nominatim cuma tambal
 * celah supaya "Gedongan, Baki, Sukoharjo" bisa muncul lengkap walau
 * Geoapify sendiri cuma punya "Baki, Jawa Tengah".
 */
function fillMissingComponents(
    primary: ReverseGeocodedAddressComponents,
    secondary: Partial<ReverseGeocodedAddressComponents>,
): ReverseGeocodedAddressComponents {
    const merged = { ...primary };

    for (const key of Object.keys(secondary) as Array<
        keyof ReverseGeocodedAddressComponents
    >) {
        if (!merged[key] && secondary[key]) {
            merged[key] = secondary[key];
        }
    }

    return merged;
}

/**
 * Menyusun string alamat dari komponen-komponen individual, alih-alih
 * langsung memakai `properties.formatted` bawaan Geoapify — supaya
 * urutan & level detail yang tampil konsisten dengan struktur alamat
 * Indonesia: nama tempat (POI), jalan, RT/RW, dusun, desa/kelurahan,
 * kecamatan, kota/kabupaten, provinsi.
 *
 * `components.name` hanya diisi oleh `geoapifyAddressComponents` saat
 * result_type adalah amenity/building (tempat khusus seperti kantor
 * kelurahan, gedung, dll). Untuk titik generik (GPS/pin drop) name
 * tidak diisi sehingga alamat hanya menampilkan wilayah administratif.
 */
export function formatAddressFromComponents(
    components: ReverseGeocodedAddressComponents,
): string {
    const streetLine = [components.road, components.houseNumber]
        .filter((part): part is string => Boolean(part && part.trim() !== ''))
        .join(' No. ');

    const parts = [
        components.name,
        streetLine || undefined,
        components.neighbourhood,
        components.hamlet,
        components.village,
        components.suburb,
        components.district,
        components.city ?? components.regency,
        components.state,
        components.postcode,
    ];

    return dedupeAddressParts(parts).join(', ');
}

/**
 * Menghapus bagian alamat yang kosong atau duplikat (case-insensitive).
 * Mencegah komponen seperti "Surakarta, Surakarta" bila Geoapify
 * mengisi `city` dan `regency` dengan nilai yang sama.
 */
function dedupeAddressParts(parts: (string | undefined)[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const part of parts) {
        if (!part || part.trim() === '') {
            continue;
        }

        const trimmed = part.trim();
        const key = trimmed.toLowerCase();

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(trimmed);
    }

    return result;
}

function precisionFromComponents(
    components: ReverseGeocodedAddressComponents,
    properties: GeoapifyResultProperties,
): ReverseGeocodedAddress['precision'] {
    const resultType =
        typeof properties.result_type === 'string'
            ? properties.result_type
            : undefined;

    // Geoapify bisa mengembalikan POI/bangunan terdekat meskipun jaraknya
    // jauh dari titik yang diminta. Jangan klaim presisi 'building' hanya
    // berdasarkan result_type bila match itu ternyata jauh — turunkan ke
    // level di bawahnya supaya tidak terkesan pin berada tepat di POI itu.
    const isNearbyMatch =
        typeof properties.distance !== 'number' ||
        properties.distance <= MaximumPoiNameMatchDistanceMeters;

    if (
        isNearbyMatch &&
        (resultType === 'building' ||
            resultType === 'amenity' ||
            components.houseNumber)
    ) {
        return 'building';
    }

    const isWithinStreetRange =
        typeof properties.distance !== 'number' ||
        properties.distance <= MaximumStreetMatchDistanceMeters;

    if (isWithinStreetRange && (resultType === 'street' || components.road)) {
        return 'street';
    }

    if (
        resultType === 'suburb' ||
        resultType === 'district' ||
        resultType === 'city' ||
        resultType === 'village' ||
        components.city ||
        components.district ||
        components.suburb
    ) {
        return 'area';
    }

    if (
        resultType === 'state' ||
        resultType === 'country' ||
        components.state ||
        components.country
    ) {
        return 'region';
    }

    return 'unknown';
}

function cacheReverseGeocodeResult(
    cacheKey: string,
    result: ReverseGeocodedAddress,
): void {
    if (reverseGeocodeCache.size >= ReverseGeocodeCacheMaximumEntries) {
        const oldestCacheKey = reverseGeocodeCache.keys().next().value;

        if (oldestCacheKey) {
            reverseGeocodeCache.delete(oldestCacheKey);
        }
    }

    reverseGeocodeCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + ReverseGeocodeCacheDurationMs,
    });
}

function numericCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const coordinate = Number(value);

    return Number.isFinite(coordinate) ? coordinate : null;
}

/**
 * Subset field alamat Nominatim (OpenStreetMap) yang relevan untuk
 * melengkapi hierarki administratif Indonesia. Nominatim menaruh nama
 * kecamatan kadang di `city_district`, kadang di `suburb`, tergantung
 * kelengkapan tagging admin_level di area tersebut — makanya kedua field
 * dicoba saat memetakan ke `district`/`suburb` kita.
 */
type NominatimAddress = {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
};

type GeoapifyResultProperties = {
    formatted?: string;
    housenumber?: string;
    street?: string;
    name?: string;

    suburb?: string;
    neighbourhood?: string;
    hamlet?: string;
    village?: string;

    district?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    result_type?: string;
    /** Jarak (meter) antara titik yang diminta dan hasil match Geoapify. */
    distance?: number;
};

/**
 * Geoapify bisa mengembalikan hasil dalam 2 bentuk tergantung parameter
 * `format`: sebagai objek `results[]` biasa, atau sebagai GeoJSON
 * `features[].properties`. Fungsi ini menangani keduanya.
 */
function firstGeoapifyResultProperties(
    payload: unknown,
): GeoapifyResultProperties | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const asResults = (payload as { results?: unknown }).results;

    if (Array.isArray(asResults) && asResults.length > 0) {
        const first = asResults[0];

        return first && typeof first === 'object'
            ? (first as GeoapifyResultProperties)
            : null;
    }

    const asFeatures = (payload as { features?: unknown }).features;

    if (Array.isArray(asFeatures) && asFeatures.length > 0) {
        const properties = (
            asFeatures[0] as { properties?: unknown } | undefined
        )?.properties;

        return properties && typeof properties === 'object'
            ? (properties as GeoapifyResultProperties)
            : null;
    }

    return null;
}

function geoapifyAddressComponents(
    properties: GeoapifyResultProperties,
): ReverseGeocodedAddressComponents {
    const isPoiOrBuilding =
        properties.result_type === 'amenity' ||
        properties.result_type === 'building';

    // Hanya pakai nama POI/bangunan bila match-nya cukup dekat dengan titik
    // yang diminta. Kalau Geoapify "melempar" ke POI terdekat yang jauh
    // (mis. karena titik yang di-drop tidak punya data persis), nama POI
    // itu tidak relevan dan justru menyesatkan (seolah pin ada di sana).
    const isNearbyMatch =
        typeof properties.distance !== 'number' ||
        properties.distance <= MaximumPoiNameMatchDistanceMeters;

    const isWithinStreetRange =
        typeof properties.distance !== 'number' ||
        properties.distance <= MaximumStreetMatchDistanceMeters;

    return {
        houseNumber: isWithinStreetRange ? properties.housenumber : undefined,
        road: isWithinStreetRange ? properties.street : undefined,
        name: isPoiOrBuilding && isNearbyMatch ? properties.name : undefined,

        neighbourhood: properties.neighbourhood,
        hamlet: properties.hamlet,
        village: properties.village,
        suburb: properties.suburb,

        city: properties.city,
        district: properties.district,
        regency: properties.county,
        postcode: properties.postcode,
        state: properties.state,
        country: properties.country,
    };
}

/**
 * Memvalidasi hasil Geolocation API terhadap ambang akurasi maksimum.
 * Kembalikan true jika posisi cukup akurat untuk ditampilkan/reverse-geocode.
 */
export function isLocationAccurateEnough(
    position: GeolocationPosition,
): boolean {
    return position.coords.accuracy <= MaximumCurrentLocationAccuracyMeters;
}

/**
 * Berapa kali maksimal `getAccurateCurrentPosition` boleh mencoba ulang
 * saat fix yang didapat masih belum cukup akurat (bukan error), sebelum
 * akhirnya memakai fix terbaik yang sempat didapat.
 */
const MaximumGpsAccuracyRetries = 3;

/**
 * Pembungkus getCurrentPosition dengan pengaturan yang memaksimalkan
 * akurasi (GPS, bukan cell tower/WiFi saja) — termasuk mekanisme retry
 * bila fix pertama belum akurat.
 *
 * Sama seperti `handleUseCurrentLocation` di `location-command.tsx`:
 * jika akurasi belum cukup, coba lagi (dengan memberi GPS waktu untuk
 * "lock" satelit) sampai jatah habis, lalu pakai fix terbaah yang pernah
 * didapat.
 */
export function getAccurateCurrentPosition(
    options?: PositionOptions,
): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation is not supported on this device.'));

            return;
        }

        let retryCount = 0;
        let bestFix: GeolocationPosition | null = null;

        const attempt = () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    // Simpan fix terbaah sebagai fallback
                    if (
                        !bestFix ||
                        pos.coords.accuracy < bestFix.coords.accuracy
                    ) {
                        bestFix = pos;
                    }

                    // Sudah akurat — langsung pakai
                    if (isLocationAccurateEnough(pos)) {
                        resolve(pos);

                        return;
                    }

                    // Belum akurat, coba lagi selama masih ada jatah
                    if (retryCount < MaximumGpsAccuracyRetries) {
                        retryCount += 1;
                        window.setTimeout(attempt, 700);

                        return;
                    }

                    // Jatah habis — pakai fix terbaah yang sempat didapat
                    resolve(bestFix ?? pos);
                },
                (err) => {
                    reject(err);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15_000,
                    maximumAge: 0,
                    ...options,
                },
            );
        };

        attempt();
    });
}
