<?php

namespace App\Services\Printing;

use App\Models\Tenant;
use App\Models\User;

class KitchenPrinterResolver
{
    public function resolveKitchenPrinter(?int $kitchenId): ?array
    {
        if (!$kitchenId) {
            return null;
        }

        $kitchen = User::query()
            ->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port')
            ->select('id', 'name')
            ->find($kitchenId);

        if (!$kitchen) {
            return null;
        }

        $printer = $kitchen->kitchenDetail;
        if (!$printer || empty($printer->printer_ip)) {
            return null;
        }

        return [
            'target_type' => 'kitchen',
            'target_id' => (int) $kitchen->id,
            'target_name' => $kitchen->name,
            'printer_ip' => (string) $printer->printer_ip,
            'printer_port' => (int) ($printer->printer_port ?: 9100),
        ];
    }

    public function resolveRestaurantPrinter(?int $restaurantId): ?array
    {
        if (!$restaurantId) {
            return null;
        }

        $tenant = Tenant::query()->select('id', 'name', 'printer_ip', 'printer_port')->find($restaurantId);
        if (!$tenant || empty($tenant->printer_ip)) {
            return null;
        }

        return [
            'target_type' => 'restaurant',
            'target_id' => (int) $tenant->id,
            'target_name' => $tenant->name,
            'printer_ip' => (string) $tenant->printer_ip,
            'printer_port' => (int) ($tenant->printer_port ?: 9100),
        ];
    }
}
