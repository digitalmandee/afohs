<?php

namespace App\Services\Printing;

use App\Models\Tenant;
use App\Models\User;
use App\Support\KitchenRoleSupport;

class PrinterDiscoveryService
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function discover(?int $restaurantId = null): array
    {
        $discovered = [];

        foreach ($this->candidateSubnets($restaurantId) as $subnet) {
            foreach ($this->scanSubnet($subnet) as $printer) {
                $discovered[$printer['printer_ip'] . ':' . $printer['printer_port']] = $printer;
            }
        }

        $assignments = $this->existingAssignments($restaurantId);

        return collect(array_values($discovered))
            ->map(function (array $printer) use ($assignments) {
                $assignment = $assignments[$printer['printer_ip'] . ':' . $printer['printer_port']] ?? null;

                return [
                    'id' => $printer['printer_ip'] . ':' . $printer['printer_port'],
                    'label' => $assignment['label'] ?? ('Network Printer ' . $printer['printer_ip']),
                    'printer_ip' => $printer['printer_ip'],
                    'printer_port' => $printer['printer_port'],
                    'source' => $printer['source'],
                    'last_seen' => now()->toIso8601String(),
                    'status' => $assignment['status'] ?? 'found',
                    'assignment_label' => $assignment['assignment_label'] ?? null,
                ];
            })
            ->sortBy('printer_ip')
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>
     */
    protected function candidateSubnets(?int $restaurantId): array
    {
        $subnets = [];

        $restaurant = $restaurantId
            ? Tenant::query()->select('printer_ip')->find($restaurantId)
            : null;

        if ($restaurant?->printer_ip) {
            $subnet = $this->subnetFromIp((string) $restaurant->printer_ip);
            if ($subnet) {
                $subnets[] = $subnet;
            }
        }

        if (KitchenRoleSupport::exists()) {
            KitchenRoleSupport::usersQuery()
                ->with('kitchenDetail:id,kitchen_id,printer_ip')
                ->get()
                ->each(function (User $user) use (&$subnets) {
                    $subnet = $this->subnetFromIp((string) ($user->kitchenDetail?->printer_ip ?? ''));
                    if ($subnet) {
                        $subnets[] = $subnet;
                    }
                });
        }

        foreach ($this->localIpv4Addresses() as $ip) {
            $subnet = $this->subnetFromIp($ip);
            if ($subnet) {
                $subnets[] = $subnet;
            }
        }

        return array_slice(array_values(array_unique($subnets)), 0, 2);
    }

    protected function subnetFromIp(string $ip): ?string
    {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) || str_starts_with($ip, '127.')) {
            return null;
        }

        $parts = explode('.', $ip);
        return count($parts) === 4 ? "{$parts[0]}.{$parts[1]}.{$parts[2]}" : null;
    }

    /**
     * @return array<int, string>
     */
    protected function localIpv4Addresses(): array
    {
        $addresses = [];

        foreach ((@gethostbynamel(gethostname()) ?: []) as $ip) {
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && !str_starts_with($ip, '127.')) {
                $addresses[] = $ip;
            }
        }

        return array_values(array_unique($addresses));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function scanSubnet(string $subnet): array
    {
        $results = [];

        for ($host = 1; $host <= 254; $host++) {
            $ip = "{$subnet}.{$host}";
            $connection = @fsockopen($ip, 9100, $errno, $errstr, 0.03);

            if ($connection !== false) {
                fclose($connection);
                $results[] = [
                    'printer_ip' => $ip,
                    'printer_port' => 9100,
                    'source' => 'network_scan',
                ];
            }
        }

        return $results;
    }

    /**
     * @return array<string, array<string, string>>
     */
    protected function existingAssignments(?int $restaurantId): array
    {
        $assignments = [];

        if ($restaurantId) {
            $restaurant = Tenant::query()->select('name', 'printer_ip', 'printer_port')->find($restaurantId);
            if ($restaurant?->printer_ip) {
                $assignments[$restaurant->printer_ip . ':' . (int) ($restaurant->printer_port ?: 9100)] = [
                    'status' => 'assigned_as_receipt',
                    'assignment_label' => 'Assigned as receipt printer',
                    'label' => $restaurant->name . ' receipt printer',
                ];
            }
        }

        if (KitchenRoleSupport::exists()) {
            KitchenRoleSupport::usersQuery()
                ->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port')
                ->get()
                ->each(function (User $user) use (&$assignments) {
                    if (!$user->kitchenDetail?->printer_ip) {
                        return;
                    }

                    $assignments[$user->kitchenDetail->printer_ip . ':' . (int) ($user->kitchenDetail->printer_port ?: 9100)] = [
                        'status' => 'assigned_to_kitchen',
                        'assignment_label' => 'Assigned to ' . $user->name,
                        'label' => $user->name . ' printer',
                    ];
                });
        }

        return $assignments;
    }
}
