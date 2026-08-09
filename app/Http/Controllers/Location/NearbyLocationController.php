<?php

namespace App\Http\Controllers\Location;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\NearbyLocationRequest;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class NearbyLocationController extends Controller
{
    /**
     * Radius pencarian default dalam meter untuk saran terdekat.
     */
    public const SearchRadiusMeters = 500;

    /**
     * Batas maksimum hasil yang dikembalikan.
     */
    public const ResultLimit = 20;

    /**
     * Kategori OSM yang menghasilkan saran terdekat yang bermakna.
     * Bangunan mentah, pintu masuk, dan tipe serupa dikecualikan.
     *
     * @var list<string>
     */
    private const MeaningfulOsmKeys = [
        'amenity',
        'shop',
        'tourism',
        'leisure',
        'place',
        'highway',
        'office',
        'public_transport',
        'healthcare',
        'education',
        'sport',
        'historic',
        'natural',
        'railway',
        'aeroway',
        'craft',
        'waterway',
        'man_made',
        'landuse',
        'boundary',
        'building',
    ];

    public function __invoke(NearbyLocationRequest $request): JsonResponse
    {
        $latitude = (float) $request->input('latitude');
        $longitude = (float) $request->input('longitude');
        $radius = (float) ($request->input('radius') ?? self::SearchRadiusMeters);

        $query = $this->buildOverpassQuery($latitude, $longitude, $radius);

        try {
            $response = $this->overpassClient()
                ->asForm()
                ->post('', ['data' => $query]);
        } catch (\Throwable) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
            ]);
        }

        if (! $response->successful()) {
            return response()->json([
                'type' => 'FeatureCollection',
                'features' => [],
            ]);
        }

        $elements = $response->json('elements', []);

        $features = $this->parseOverpassElements($elements, $latitude, $longitude);

        return response()->json([
            'type' => 'FeatureCollection',
            'features' => $features,
        ]);
    }

    /**
     * Membangun query Overpass QL untuk mencari tempat bernama di sekitar titik.
     */
    private function buildOverpassQuery(float $latitude, float $longitude, float $radius): string
    {
        $around = "around:{$radius},{$latitude},{$longitude}";
        $limit = self::ResultLimit;

        return <<<OVERPASS
[out:json][timeout:10];
(
  node[{$around}]["name"];
  way[{$around}]["name"];
);
out center tags {$limit};
OVERPASS;
    }

    /**
     * @param  array<int, array<string, mixed>>  $elements
     * @return array<int, array<string, mixed>>
     */
    private function parseOverpassElements(array $elements, float $originLatitude, float $originLongitude): array
    {
        $features = [];

        foreach ($elements as $element) {
            if (! is_array($element)) {
                continue;
            }

            $tags = $element['tags'] ?? [];

            if (! is_array($tags) || empty($tags['name'])) {
                continue;
            }

            $coordinates = $this->elementCoordinates($element);

            if ($coordinates === null) {
                continue;
            }

            [$featureLongitude, $featureLatitude] = $coordinates;

            $osmKey = $this->primaryOsmKey($tags);
            $osmValue = $tags[$osmKey] ?? 'unknown';
            $osmType = match ($element['type'] ?? '') {
                'node' => 'N',
                'way' => 'W',
                'relation' => 'R',
                default => 'N',
            };

            $features[] = [
                'type' => 'Feature',
                'geometry' => [
                    'type' => 'Point',
                    'coordinates' => [$featureLongitude, $featureLatitude],
                ],
                'properties' => [
                    'osm_id' => (int) ($element['id'] ?? 0),
                    'osm_type' => $osmType,
                    'osm_key' => $osmKey,
                    'osm_value' => $osmValue,
                    'type' => $osmKey,
                    'name' => $tags['name'],
                    'housenumber' => $tags['addr:housenumber'] ?? null,
                    'street' => $tags['addr:street'] ?? null,
                    'locality' => $tags['addr:suburb']
                        ?? $tags['addr:neighbourhood']
                        ?? $tags['addr:hamlet']
                        ?? null,
                    'district' => $tags['addr:district'] ?? null,
                    'postcode' => $tags['addr:postcode'] ?? null,
                    'city' => $tags['addr:city'] ?? null,
                    'county' => $tags['addr:county'] ?? null,
                    'state' => $tags['addr:state'] ?? null,
                    'country' => $tags['addr:country'] ?? null,
                ],
                '_distance' => $this->haversineDistanceMeters(
                    $originLatitude,
                    $originLongitude,
                    $featureLatitude,
                    $featureLongitude,
                ),
            ];
        }

        usort($features, fn (array $a, array $b): int => $a['_distance'] <=> $b['_distance']);

        // Hapus field internal _distance setelah sorting.
        return array_map(function (array $feature): array {
            unset($feature['_distance']);

            return $feature;
        }, array_slice($features, 0, self::ResultLimit));
    }

    /**
     * Mengambil koordinat [longitude, latitude] dari elemen Overpass.
     *
     * @param  array<string, mixed>  $element
     * @return array{0: float, 1: float}|null
     */
    private function elementCoordinates(array $element): ?array
    {
        $type = $element['type'] ?? '';

        if ($type === 'node') {
            $lat = $element['lat'] ?? null;
            $lon = $element['lon'] ?? null;

            if ($lat === null || $lon === null) {
                return null;
            }

            return [(float) $lon, (float) $lat];
        }

        if ($type === 'way' || $type === 'relation') {
            $center = $element['center'] ?? null;

            if (! is_array($center)) {
                return null;
            }

            $lat = $center['lat'] ?? null;
            $lon = $center['lon'] ?? null;

            if ($lat === null || $lon === null) {
                return null;
            }

            return [(float) $lon, (float) $lat];
        }

        return null;
    }

    /**
     * Menentukan key OSM utama dari tags (amenity, shop, highway, dll).
     *
     * @param  array<string, mixed>  $tags
     */
    private function primaryOsmKey(array $tags): string
    {
        foreach (self::MeaningfulOsmKeys as $key) {
            if (array_key_exists($key, $tags)) {
                return $key;
            }
        }

        // Fallback: ambil key pertama yang bukan addr:* atau name
        foreach (array_keys($tags) as $key) {
            if (! str_starts_with($key, 'addr:') && $key !== 'name') {
                return $key;
            }
        }

        return 'place';
    }

    private function haversineDistanceMeters(
        float $originLatitude,
        float $originLongitude,
        float $destinationLatitude,
        float $destinationLongitude,
    ): float {
        $earthRadius = 6371000.0;
        $latDelta = deg2rad($destinationLatitude - $originLatitude);
        $lonDelta = deg2rad($destinationLongitude - $originLongitude);
        $originLatRad = deg2rad($originLatitude);
        $destLatRad = deg2rad($destinationLatitude);

        $haversine = sin($latDelta / 2) ** 2
            + cos($originLatRad) * cos($destLatRad) * sin($lonDelta / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($haversine), sqrt(1 - $haversine));
    }

    private function overpassClient(): PendingRequest
    {
        return Http::baseUrl(config('services.overpass.url'))
            ->timeout(15)
            ->connectTimeout(10);
    }
}
