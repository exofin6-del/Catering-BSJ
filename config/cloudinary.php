<?php

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'secure' => true,
    'timeout' => (int) env('CLOUDINARY_TIMEOUT', 30),
    'connect_timeout' => (int) env('CLOUDINARY_CONNECT_TIMEOUT', 10),
];
