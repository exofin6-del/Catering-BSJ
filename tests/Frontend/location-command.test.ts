import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const locationCommand = readFileSync(
    new URL(
        '../../resources/js/components/shared/mapV2/location-command.tsx',
        import.meta.url,
    ),
    'utf8',
);

test('location drawer fills the mobile viewport', () => {
    assert.match(locationCommand, /h-\[100svh\]/);
    assert.match(locationCommand, /max-sm:w-screen!/);
    assert.match(locationCommand, /max-sm:max-w-none!/);
});

test('location map and nearby suggestions require granted permission', () => {
    assert.match(
        locationCommand,
        /const isLocationPermissionGranted = permissionState === 'granted'/,
    );
    assert.match(
        locationCommand,
        /const showMap =\s+isLocationPermissionGranted/,
    );
    assert.match(
        locationCommand,
        /!isSearchMode && !isLocationPermissionGranted &&/,
    );
    assert.match(locationCommand, /getNearbyLocations\(/);
    assert.match(
        locationCommand,
        /if \(!open \|\| isSearchMode \|\| !isOriginReady \|\| !resolvedOrigin\)/,
    );
});

test('location permission is requested when the drawer opens', () => {
    assert.match(
        locationCommand,
        /if \(gpsCoord\) \{\s+return;\s+\}\s+\s+if \(permission === 'prompt' \|\| permission === 'granted'/,
    );
    assert.match(locationCommand, /navigator\.geolocation\.getCurrentPosition/);
});
