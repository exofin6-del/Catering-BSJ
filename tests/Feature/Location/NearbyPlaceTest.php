<?php

namespace Tests\Feature\Location;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NearbyPlaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_named_openstreetmap_places_sorted_by_distance(): void
    {
        Http::fake([
            config('services.overpass.url').'*' => Http::response([
                'elements' => [
                    [
                        'type' => 'node',
                        'id' => 101,
                        'lat' => -7.5664,
                        'lon' => 110.8167,
                        'tags' => [
                            'amenity' => 'school',
                            'name' => 'SD Gedongan',
                        ],
                    ],
                    [
                        'type' => 'way',
                        'id' => 102,
                        'center' => [
                            'lat' => -7.5666,
                            'lon' => 110.8167,
                        ],
                        'tags' => [
                            'highway' => 'residential',
                            'name' => 'Jalan Mawar',
                        ],
                    ],
                ],
            ]),
        ]);

        $this
            ->getJson(route('locations.nearby', [
                'latitude' => -7.5666,
                'longitude' => 110.8167,
            ]))
            ->assertOk()
            ->assertJsonPath('features.0.properties.name', 'Jalan Mawar')
            ->assertJsonPath('features.0.properties.osm_value', 'residential')
            ->assertJsonPath('features.1.properties.name', 'SD Gedongan')
            ->assertJsonCount(2, 'features');

        Http::assertSent(function (Request $request): bool {
            $query = $request->data()['data'] ?? null;

            return str_contains($request->url(), 'overpass-api.de')
                && is_string($query)
                && str_contains($query, 'around:500,')
                && ! str_contains($query, '{self::SearchRadiusMeters}');
        });
    }

    public function test_it_rejects_invalid_coordinates(): void
    {
        $this
            ->getJson(route('locations.nearby', [
                'latitude' => 91,
                'longitude' => 110.8167,
            ]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.latitude.0', 'The latitude field must be between -90 and 90.');
    }
}
