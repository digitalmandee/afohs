<?php

namespace App\Helpers;

use Illuminate\Http\UploadedFile;

class FileHelper
{
    public static function saveImage(UploadedFile $image, string $folder): string
    {
        $tenantId = session('active_restaurant_id') ?? tenant('id') ?? 'default';

        // Define tenant-specific folder inside public
        $destinationPath = public_path("tenants/{$tenantId}/{$folder}");

        // Create folder if it doesn't exist
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0777, true);
        }

        // Generate unique filename
        $filename = time() . '_' . strtolower(str_replace(' ', '-', $image->getClientOriginalName()));

        // Move the file to the tenant's folder
        $image->move($destinationPath, $filename);

        // Return the full URL of the image
        return "/tenants/{$tenantId}/{$folder}/{$filename}";
    }

    public static function saveBinaryImage(string $binaryData, string $folder, string $filename = null): string
    {
        $tenantId = session('active_restaurant_id') ?? tenant('id') ?? 'default';

        $destinationPath = public_path("tenants/{$tenantId}/{$folder}");

        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0777, true);
        }

        // Generate a unique filename if not provided
        $filename = $filename ?? (time() . '_' . uniqid() . '.png');

        $filePath = "{$destinationPath}/{$filename}";

        // Save the binary content
        file_put_contents($filePath, $binaryData);

        return "tenants/{$tenantId}/{$folder}/{$filename}";
    }

    public static function deleteImage(string $imagePath): bool
    {
        // Remove leading slash if present
        $imagePath = ltrim($imagePath, '/');
        
        // Build the full path to the image file
        $fullPath = public_path($imagePath);
        
        // Check if file exists and delete it
        if (file_exists($fullPath)) {
            return unlink($fullPath);
        }
        
        return false;
    }
}
