import assert from 'node:assert/strict';
import test from 'node:test';
import {
    customerBusinessCoordinate,
    customerGoogleMapsDirectionsUrl,
    customerGoogleMapsEmbedUrl,
} from '../../resources/js/features/customers/utils/customer-location.ts';

test('business coordinate accepts valid stored latitude and longitude', () => {
    assert.deepEqual(
        customerBusinessCoordinate({
            latitude: '-7.5667000',
            longitude: '110.8167000',
        }),
        {
            latitude: -7.5667,
            longitude: 110.8167,
        },
    );
});

test('business coordinate rejects missing and out-of-range values', () => {
    assert.equal(
        customerBusinessCoordinate({ latitude: null, longitude: null }),
        null,
    );
    assert.equal(
        customerBusinessCoordinate({
            latitude: '91',
            longitude: '110.8167',
        }),
        null,
    );
});

test('google maps URLs target the stored business coordinate', () => {
    const coordinate = { latitude: -7.5667, longitude: 110.8167 };

    assert.equal(
        customerGoogleMapsEmbedUrl(coordinate),
        'https://www.google.com/maps?q=-7.5667%2C110.8167&z=16&output=embed',
    );
    assert.equal(
        customerGoogleMapsDirectionsUrl(coordinate),
        'https://www.google.com/maps/dir/?api=1&destination=-7.5667%2C110.8167',
    );
});
