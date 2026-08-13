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
const businessLocationCommand = readFileSync(
    new URL(
        '../../resources/js/features/settings/components/business-location-command.tsx',
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

test('location permission is requested only after an explicit user action', () => {
    assert.match(
        locationCommand,
        /if \(gpsCoord\) \{\s+return;\s+\}\s+\s+if \(permission === 'granted'/,
    );
    assert.doesNotMatch(
        locationCommand,
        /permission === 'prompt' \|\| permission === 'granted'/,
    );
    assert.match(locationCommand, /navigator\.geolocation\.getCurrentPosition/);
    assert.match(locationCommand, /onClick=\{handleUseCurrentLocation\}/);
});

test('location permission is not kept in a stale module cache', () => {
    assert.doesNotMatch(locationCommand, /cachedPermissionState/);
    assert.match(
        locationCommand,
        /if \(!navigator\.permissions\?\.query\) \{\s+return 'prompt';/,
    );
    assert.match(
        locationCommand,
        /if \(gpsCoord\) \{\s+return;/,
    );
    assert.doesNotMatch(businessLocationCommand, /cachedPermissionState/);
    assert.match(
        businessLocationCommand,
        /if \(!navigator\.permissions\?\.query\) \{\s+return 'prompt';/,
    );
});
