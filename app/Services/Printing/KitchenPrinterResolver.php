<?php

namespace App\Services\Printing;

use App\Models\PrinterProfile;
use App\Models\Tenant;
use App\Models\User;

class KitchenPrinterResolver
{
    public function resolveKitchenPrinter(?int $kitchenId, ?int $restaurantId = null): ?array
    {
        if (!$kitchenId) {
            return null;
        }

        $kitchen = User::query()
            ->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port,printer_profile_id,printer_source,printer_name,printer_connector')
            ->select('id', 'name')
            ->find($kitchenId);

        if (!$kitchen) {
            return null;
        }

        $printer = $kitchen->kitchenDetail;
        if (!$printer) {
            return null;
        }

        $profile = $this->resolveProfile($printer->printer_profile_id, $restaurantId);
        if ($profile) {
            return [
                'target_type' => 'kitchen',
                'target_id' => (int) $kitchen->id,
                'target_name' => $kitchen->name,
                'printer_profile_id' => (int) $profile->id,
                'printer_label' => $profile->name,
                'printer_source' => 'network_scan',
                'printer_ip' => (string) $profile->printer_ip,
                'printer_port' => (int) ($profile->printer_port ?: 9100),
                'printer_name' => null,
                'printer_connector' => null,
            ];
        }

        if (!$this->hasConfiguredPrinter($printer->printer_source, $printer->printer_ip, $printer->printer_name)) {
            return null;
        }

        return [
            'target_type' => 'kitchen',
            'target_id' => (int) $kitchen->id,
            'target_name' => $kitchen->name,
            'printer_profile_id' => null,
            'printer_label' => $printer->printer_name ?: $printer->printer_ip,
            'printer_source' => $printer->printer_source ?: ($printer->printer_name ? 'system_printer' : 'network_scan'),
            'printer_ip' => $printer->printer_ip ? (string) $printer->printer_ip : null,
            'printer_port' => $printer->printer_ip ? (int) ($printer->printer_port ?: 9100) : null,
            'printer_name' => $printer->printer_name ? (string) $printer->printer_name : null,
            'printer_connector' => $printer->printer_connector ?: (PHP_OS_FAMILY === 'Windows' ? 'windows' : 'cups'),
        ];
    }

    public function resolveRestaurantPrinter(?int $restaurantId): ?array
    {
        if (!$restaurantId) {
            return null;
        }

        $tenant = Tenant::query()->select('id', 'name', 'printer_ip', 'printer_port', 'printer_profile_id', 'printer_source', 'printer_name', 'printer_connector')->find($restaurantId);
        if (!$tenant) {
            return null;
        }

        $profile = $this->resolveProfile($tenant->printer_profile_id, $restaurantId);
        if ($profile) {
            return [
                'target_type' => 'restaurant',
                'target_id' => (int) $tenant->id,
                'target_name' => $tenant->name,
                'printer_profile_id' => (int) $profile->id,
                'printer_label' => $profile->name,
                'printer_source' => 'network_scan',
                'printer_ip' => (string) $profile->printer_ip,
                'printer_port' => (int) ($profile->printer_port ?: 9100),
                'printer_name' => null,
                'printer_connector' => null,
            ];
        }

        if (!$this->hasConfiguredPrinter($tenant->printer_source, $tenant->printer_ip, $tenant->printer_name)) {
            return null;
        }

        return [
            'target_type' => 'restaurant',
            'target_id' => (int) $tenant->id,
            'target_name' => $tenant->name,
            'printer_profile_id' => null,
            'printer_label' => $tenant->printer_name ?: $tenant->printer_ip,
            'printer_source' => $tenant->printer_source ?: ($tenant->printer_name ? 'system_printer' : 'network_scan'),
            'printer_ip' => $tenant->printer_ip ? (string) $tenant->printer_ip : null,
            'printer_port' => $tenant->printer_ip ? (int) ($tenant->printer_port ?: 9100) : null,
            'printer_name' => $tenant->printer_name ? (string) $tenant->printer_name : null,
            'printer_connector' => $tenant->printer_connector ?: (PHP_OS_FAMILY === 'Windows' ? 'windows' : 'cups'),
        ];
    }

    protected function hasConfiguredPrinter(?string $source, ?string $printerIp, ?string $printerName): bool
    {
        if (($source === 'system_printer' || ($source === null && $printerName)) && !empty($printerName)) {
            return true;
        }

        return !empty($printerIp);
    }

    protected function resolveProfile(?int $profileId, ?int $restaurantId): ?PrinterProfile
    {
        if (!$profileId) {
            return null;
        }

        return PrinterProfile::query()
            ->forRestaurant($restaurantId)
            ->where('is_active', true)
            ->find($profileId);
    }
}
