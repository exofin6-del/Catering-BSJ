<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Google reCAPTCHA v3
    |--------------------------------------------------------------------------
    |
    | Site key dipakai di frontend (halaman checkout), secret key hanya untuk
    | verifikasi server-side. Jika secret key kosong, verifikasi dilewati
    | sehingga development dan test lokal tetap berjalan normal.
    |
    */

    'site_key' => env('RECAPTCHA_SITE_KEY', ''),

    'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),

    // Skor minimum (0.0 - 1.0). Makin tinggi makin ketat.
    'min_score' => (float) env('RECAPTCHA_MIN_SCORE', 0.5),
];
