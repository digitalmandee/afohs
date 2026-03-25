<?php

namespace App\Services\Printing;

use App\Models\PrinterScanRange;
use App\Models\Tenant;
use App\Models\User;
use App\Support\KitchenRoleSupport;

class PrinterDiscoveryService
{
    protected const SCAN_TIMEOUT_SECONDS = 0.03;
    protected const MAX_HOSTS_PER_RANGE = 512;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function discover(?int $restaurantId = null): array
    {
        return $this->discoverBundle($restaurantId)['printers'];
    }

    /**
     * @return array{printers: array<int, array<string, mixed>>, sources: array<string, array<string, mixed>>, scan_ranges: array<int, array<string, mixed>>, summary: array<string, int>}
     */
    public function discoverBundle(?int $restaurantId = null): array
    {
        $discovered = [];
        $rangeSummaries = [];
        $startedAt = microtime(true);

        foreach ($this->candidateRanges($restaurantId) as $range) {
            $rangeStartedAt = microtime(true);
            $result = $this->scanRange($range);

            $rangeSummaries[] = [
                'id' => $range['id'],
                'label' => $range['label'],
                'range_value' => $range['range_value'],
                'range_type' => $range['range_type'],
                'port' => $range['port'],
                'source' => $range['source'],
                'source_label' => $range['source_label'],
                'scanned_hosts' => $result['scanned_hosts'],
                'found_count' => count($result['printers']),
                'status' => $result['status'],
                'message' => $result['message'],
                'duration_ms' => (int) round((microtime(true) - $rangeStartedAt) * 1000),
            ];

            foreach ($result['printers'] as $printer) {
                $discovered[$printer['id']] = $printer;
            }
        }

        $assignments = $this->existingAssignments($restaurantId);

        $printers = collect(array_values($discovered))
            ->map(function (array $printer) use ($assignments) {
                $assignment = $assignments[$printer['id']] ?? null;

                return [
                    'id' => $printer['id'],
                    'label' => $assignment['label'] ?? $printer['label'],
                    'printer_ip' => $printer['printer_ip'] ?? null,
                    'printer_port' => $printer['printer_port'] ?? null,
                    'printer_name' => $printer['printer_name'] ?? null,
                    'printer_connector' => $printer['printer_connector'] ?? null,
                    'source' => $printer['source'],
                    'range_label' => $printer['range_label'] ?? null,
                    'range_value' => $printer['range_value'] ?? null,
                    'last_seen' => now()->toIso8601String(),
                    'status' => $assignment['status'] ?? 'found',
                    'assignment_label' => $assignment['assignment_label'] ?? null,
                    'source_label' => 'Network Printer',
                ];
            })
            ->sortBy(fn (array $printer) => strtolower((string) ($printer['label'] ?? '')))
            ->values()
            ->all();

        return [
            'printers' => $printers,
            'sources' => [
                'network_scan' => [
                    'available' => true,
                    'found_count' => count($printers),
                    'message' => 'Scans the auto local subnet and any saved extra scan ranges for network printers.',
                ],
            ],
            'scan_ranges' => $rangeSummaries,
            'summary' => [
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'ranges_scanned' => count($rangeSummaries),
                'printers_found' => count($printers),
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function candidateRanges(?int $restaurantId): array
    {
        $ranges = [];
        $known = [];

        $restaurant = $restaurantId
            ? Tenant::query()->select('printer_ip')->find($restaurantId)
            : null;

        if ($restaurant?->printer_ip) {
            $subnet = $this->subnetFromIp((string) $restaurant->printer_ip);
            if ($subnet) {
                $range = $this->autoRange("auto:restaurant:{$subnet}", "Restaurant Printer Subnet {$subnet}.0/24", "{$subnet}.0/24");
                $ranges[] = $range;
                $known[$range['id']] = true;
            }
        }

        if (KitchenRoleSupport::exists()) {
            KitchenRoleSupport::usersQuery()
                ->with('kitchenDetail:id,kitchen_id,printer_ip')
                ->get()
                ->each(function (User $user) use (&$ranges, &$known) {
                    $subnet = $this->subnetFromIp((string) ($user->kitchenDetail?->printer_ip ?? ''));
                    if (!$subnet) {
                        return;
                    }

                    $range = $this->autoRange("auto:kitchen:{$subnet}", "Kitchen Subnet {$subnet}.0/24", "{$subnet}.0/24");
                    if (!isset($known[$range['id']])) {
                        $ranges[] = $range;
                        $known[$range['id']] = true;
                    }
                });
        }

        foreach ($this->localIpv4Addresses() as $ip) {
            $subnet = $this->subnetFromIp($ip);
            if (!$subnet) {
                continue;
            }

            $range = $this->autoRange("auto:local:{$subnet}", "Local Network {$subnet}.0/24", "{$subnet}.0/24");
            if (!isset($known[$range['id']])) {
                $ranges[] = $range;
                $known[$range['id']] = true;
            }
        }

        PrinterScanRange::query()
            ->forRestaurant($restaurantId)
            ->where('is_active', true)
            ->orderByDesc('tenant_id')
            ->orderBy('label')
            ->get()
            ->each(function (PrinterScanRange $range) use (&$ranges, &$known) {
                $id = 'saved:' . $range->id;
                if (isset($known[$id])) {
                    return;
                }

                $ranges[] = [
                    'id' => $id,
                    'label' => $range->label,
                    'range_value' => $range->range_value,
                    'range_type' => $range->range_type,
                    'port' => (int) ($range->port ?: 9100),
                    'source' => 'saved_range',
                    'source_label' => 'Saved Scan Range',
                ];
                $known[$id] = true;
            });

        return $ranges;
    }

    /**
     * @param array<string, mixed> $range
     * @return array<string, mixed>
     */
    protected function autoRange(string $id, string $label, string $cidr): array
    {
        return [
            'id' => $id,
            'label' => $label,
            'range_value' => $cidr,
            'range_type' => 'cidr',
            'port' => 9100,
            'source' => 'auto_range',
            'source_label' => 'Auto Local Range',
        ];
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
     * @param array<string, mixed> $range
     * @return array{printers: array<int, array<string, mixed>>, scanned_hosts: int, status: string, message: string}
     */
    protected function scanRange(array $range): array
    {
        $expanded = $this->expandRange((string) $range['range_value'], (string) $range['range_type']);
        if (!$expanded['valid']) {
            return [
                'printers' => [],
                'scanned_hosts' => 0,
                'status' => 'invalid',
                'message' => $expanded['message'],
            ];
        }

        $port = (int) ($range['port'] ?? 9100) ?: 9100;
        $results = [];
        foreach ($expanded['addresses'] as $ip) {
            $connection = @fsockopen($ip, $port, $errno, $errstr, self::SCAN_TIMEOUT_SECONDS);
            if ($connection === false) {
                continue;
            }

            fclose($connection);
            $results[] = [
                'id' => "network:{$ip}:{$port}",
                'label' => 'Network Printer ' . $ip,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'source' => 'network_scan',
                'range_label' => $range['label'],
                'range_value' => $range['range_value'],
            ];
        }

        return [
            'printers' => $results,
            'scanned_hosts' => count($expanded['addresses']),
            'status' => 'scanned',
            'message' => count($results) > 0
                ? 'Scan completed successfully.'
                : 'Scan completed but found no printers on this range.',
        ];
    }

    /**
     * @return array{valid: bool, message: string, addresses: array<int, string>}
     */
    protected function expandRange(string $rangeValue, string $rangeType): array
    {
        return $rangeType === 'range'
            ? $this->expandExplicitRange($rangeValue)
            : $this->expandCidrRange($rangeValue);
    }

    /**
     * @return array{valid: bool, message: string, addresses: array<int, string>}
     */
    protected function expandCidrRange(string $cidr): array
    {
        if (!str_contains($cidr, '/')) {
            return ['valid' => false, 'message' => 'CIDR range is missing a prefix length.', 'addresses' => []];
        }

        [$ip, $prefix] = explode('/', $cidr, 2);
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) || !is_numeric($prefix)) {
            return ['valid' => false, 'message' => 'CIDR range is invalid.', 'addresses' => []];
        }

        $prefix = (int) $prefix;
        if ($prefix < 16 || $prefix > 32) {
            return ['valid' => false, 'message' => 'CIDR prefix must be between /16 and /32.', 'addresses' => []];
        }

        $network = ip2long($ip);
        if ($network === false) {
            return ['valid' => false, 'message' => 'CIDR range is invalid.', 'addresses' => []];
        }

        $mask = -1 << (32 - $prefix);
        $start = $network & $mask;
        $hostCount = 2 ** (32 - $prefix);
        if ($hostCount > self::MAX_HOSTS_PER_RANGE) {
            return ['valid' => false, 'message' => 'Range is too large. Limit scan ranges to 512 hosts or fewer.', 'addresses' => []];
        }

        $end = $start + $hostCount - 1;
        $addresses = [];
        for ($current = $start; $current <= $end; $current++) {
            $candidate = long2ip($current);
            if (!$candidate || str_ends_with($candidate, '.0') || str_ends_with($candidate, '.255')) {
                continue;
            }
            $addresses[] = $candidate;
        }

        return ['valid' => true, 'message' => 'ok', 'addresses' => $addresses];
    }

    /**
     * @return array{valid: bool, message: string, addresses: array<int, string>}
     */
    protected function expandExplicitRange(string $rangeValue): array
    {
        $parts = array_map('trim', explode('-', $rangeValue, 2));
        if (count($parts) !== 2 || !filter_var($parts[0], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) || !filter_var($parts[1], FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            return ['valid' => false, 'message' => 'IP range must look like 192.168.10.20-192.168.10.80.', 'addresses' => []];
        }

        $start = ip2long($parts[0]);
        $end = ip2long($parts[1]);
        if ($start === false || $end === false || $start > $end) {
            return ['valid' => false, 'message' => 'IP range start must be before the end.', 'addresses' => []];
        }

        if (($end - $start + 1) > self::MAX_HOSTS_PER_RANGE) {
            return ['valid' => false, 'message' => 'Range is too large. Limit scan ranges to 512 hosts or fewer.', 'addresses' => []];
        }

        $addresses = [];
        for ($current = $start; $current <= $end; $current++) {
            $candidate = long2ip($current);
            if ($candidate) {
                $addresses[] = $candidate;
            }
        }

        return ['valid' => true, 'message' => 'ok', 'addresses' => $addresses];
    }

    /**
     * @return array<string, array<string, string>>
     */
    protected function existingAssignments(?int $restaurantId): array
    {
        $assignments = [];

        if ($restaurantId) {
            $restaurant = Tenant::query()->select('name', 'printer_ip', 'printer_port')->find($restaurantId);
            if ($restaurant && $restaurant->printer_ip) {
                $assignments['network:' . $restaurant->printer_ip . ':' . ((int) ($restaurant->printer_port ?: 9100) ?: 9100)] = [
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
                    $detail = $user->kitchenDetail;
                    if (!$detail?->printer_ip) {
                        return;
                    }

                    $assignments['network:' . $detail->printer_ip . ':' . ((int) ($detail->printer_port ?: 9100) ?: 9100)] = [
                        'status' => 'assigned_to_kitchen',
                        'assignment_label' => 'Assigned to ' . $user->name,
                        'label' => $user->name . ' printer',
                    ];
                });
        }

        return $assignments;
    }
}
