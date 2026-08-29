<?php

return [
    'audience' => 'customer-storefront',
    'cookie' => env('CUSTOMER_JWT_COOKIE', 'customer_auth'),
    'lifetime' => (int) env('CUSTOMER_JWT_LIFETIME', 60 * 24 * 7),
    'secret' => env('CUSTOMER_JWT_SECRET', env('APP_KEY')),
];
