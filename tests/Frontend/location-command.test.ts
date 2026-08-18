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

test('location drawers use the same edge-to-edge mobile panel treatment', () => {
    for (const locationDrawer of [locationCommand, businessLocationCommand]) {
        assert.match(locationDrawer, /h-\[100svh\]/);
        assert.match(locationDrawer, /w-screen/);
        assert.match(locationDrawer, /max-w-none/);
        assert.match(locationDrawer, /\[--drawer-inset:0px\]/);
        assert.match(locationDrawer, /\[--drawer-bleed:0px\]/);
    }
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

test('granted location permission loads automatically and remains user-recoverable', () => {
    assert.match(
        locationCommand,
        /if \(permission !== 'granted'\) \{\s+return;\s+\}\s+\s+if \(gpsCoord\) \{\s+return;\s+\}/,
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
    assert.match(locationCommand, /if \(gpsCoord\) \{\s+return;/);
    assert.doesNotMatch(businessLocationCommand, /cachedPermissionState/);
    assert.match(
        businessLocationCommand,
        /if \(!navigator\.permissions\?\.query\) \{\s+return 'prompt';/,
    );
});

test('customer location controls match the customer surface styling', () => {
    assert.match(
        locationCommand,
        /surface === 'storefront'\s+\? 'secondary'\s+: 'ghost'/,
    );
    assert.match(
        locationCommand,
        /rounded-full bg-primary\/10 text-primary transition-all duration-200 hover:bg-primary\/20/,
    );
    assert.match(
        locationCommand,
        /surface === 'storefront'[\s\S]*rounded-full!/,
    );
});
