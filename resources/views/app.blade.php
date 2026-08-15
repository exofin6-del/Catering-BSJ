@php
    $isCustomerPage =
        str_starts_with($page['component'] ?? '', 'customers/') ||
        str_starts_with($page['component'] ?? '', 'customersV2/');
    $customerTheme = $isCustomerPage ? $page['props']['customerTheme'] ?? null : null;
@endphp

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class([
    'admin-dark' => !$isCustomerPage && ($appearance ?? 'system') === 'dark',
])
    @if ($customerTheme) data-customer-theme="{{ $customerTheme }}" @endif>

<head>
    <meta charset="utf-8">

    <script>
        // Disable native scroll restore for all pages.
        // Admin: handled by Inertia.
        // Customer: handled by public-layout.tsx.
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
    </script>

    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    {{-- Apply theme before React hydration --}}
    <script>
        (() => {
            const isCustomerPage = {{ $isCustomerPage ? 'true' : 'false' }};

            if (isCustomerPage) {
                return;
            }

            const appearance =
                localStorage.getItem('appearance') ??
                '{{ $appearance ?? 'system' }}';

            const dark =
                appearance === 'dark' ||
                (
                    appearance === 'system' &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches
                );

            document.documentElement.classList.toggle(
                'admin-dark',
                dark
            );

            document.documentElement.style.colorScheme =
                dark ? 'dark' : 'light';
        })();
    </script>

    <style>
        html {
            background: oklch(1 0 0);
        }

        html.admin-dark {
            background: oklch(0.145 0 0);
        }
    </style>

    <link rel="icon" href="/images/logo.svg" type="image/svg">
    <link rel="apple-touch-icon" href="/images/logo.svg">

    @fonts

    @viteReactRefresh

    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    <x-inertia::head>
        <title>{{ config('app.name', 'Laravel') }}</title>
    </x-inertia::head>
</head>

<body class="font-sans antialiased">
    <x-inertia::app />
</body>

</html>
