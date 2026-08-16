<?php

$cloudinaryUrl = (string) env('CLOUDINARY_URL', '');
$cloudinaryUrlParts = $cloudinaryUrl !== '' ? parse_url($cloudinaryUrl) : [];
$cloudinaryUrlParts = is_array($cloudinaryUrlParts) ? $cloudinaryUrlParts : [];

return [
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME') ?: ($cloudinaryUrlParts['host'] ?? null),
    'api_key' => env('CLOUDINARY_API_KEY') ?: ($cloudinaryUrlParts['user'] ?? null),
    'api_secret' => env('CLOUDINARY_API_SECRET') ?: (isset($cloudinaryUrlParts['pass']) ? urldecode($cloudinaryUrlParts['pass']) : null),
    'max_upload_kilobytes' => (int) env('CLOUDINARY_MAX_UPLOAD_KB', 20 * 1024),
    'secure' => true,
    'timeout' => (int) env('CLOUDINARY_TIMEOUT', 30),
    'connect_timeout' => (int) env('CLOUDINARY_CONNECT_TIMEOUT', 10),
];
