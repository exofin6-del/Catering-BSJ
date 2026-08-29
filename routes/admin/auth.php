<?php

use Illuminate\Support\Facades\Route;

// Login admin ditangani Fortify (GET/POST /login, lihat FortifyServiceProvider).
// Nama route "login" dipakai exception handler Laravel untuk mengarahkan guest
// yang membuka halaman admin ke halaman login.
