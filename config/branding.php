<?php

return [
    'logo_path' => env('BRANDING_LOGO_PATH', 'assets/Logo.png'),
    'logo_fallback_paths' => array_values(array_filter(array_map(
        static fn (string $path): string => trim($path),
        explode(',', (string) env('BRANDING_LOGO_FALLBACK_PATHS', 'assets/Logo1.png,afohs-icon.png,logo.svg'))
    ))),
];

