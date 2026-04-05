<?php

namespace App\Support\Branding;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class StaticDocumentBrandingResolver
{
    public function resolveLogoDataUri(): ?string
    {
        $configuredPrimary = trim((string) config('branding.logo_path', ''));
        $configuredFallbacks = config('branding.logo_fallback_paths', []);
        $fallbackPaths = is_array($configuredFallbacks) ? $configuredFallbacks : [];

        $relativeCandidates = collect(array_merge(
            [$configuredPrimary],
            $fallbackPaths,
            ['images/logo.png']
        ))
            ->map(fn ($path) => trim((string) $path))
            ->filter()
            ->unique()
            ->values()
            ->all();

        foreach ($relativeCandidates as $relativePath) {
            $absolutePath = public_path(ltrim($relativePath, '/'));
            if (!File::exists($absolutePath) || !File::isFile($absolutePath)) {
                continue;
            }

            $mime = File::mimeType($absolutePath) ?: 'image/png';
            $contents = base64_encode((string) File::get($absolutePath));

            return "data:{$mime};base64,{$contents}";
        }

        Log::warning('branding.logo_missing', [
            'event' => 'branding.logo_missing',
            'searched_paths' => $relativeCandidates,
        ]);

        return null;
    }
}

