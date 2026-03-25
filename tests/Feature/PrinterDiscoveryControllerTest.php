<?php

namespace Tests\Feature;

use App\Http\Controllers\PrinterTestController;
use App\Services\Printing\PrinterConnectorFactory;
use App\Services\Printing\KitchenPrinterResolver;
use App\Services\Printing\PrinterDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class PrinterDiscoveryControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_discover_returns_scanned_printers_payload(): void
    {
        $service = new class extends PrinterDiscoveryService {
            public function discoverBundle(?int $restaurantId = null): array
            {
                return [
                    'printers' => [[
                        'id' => 'network:192.168.1.50:9100',
                        'label' => 'Kitchen Printer 1',
                        'printer_ip' => '192.168.1.50',
                        'printer_port' => 9100,
                        'printer_name' => null,
                        'printer_connector' => null,
                        'source' => 'network_scan',
                        'last_seen' => now()->toIso8601String(),
                        'status' => 'found',
                        'assignment_label' => null,
                        'source_label' => 'Network Printer',
                    ]],
                    'sources' => [
                        'network_scan' => ['available' => true, 'found_count' => 1, 'message' => 'Network scan complete.'],
                    ],
                    'scan_ranges' => [[
                        'id' => 'auto:local:192.168.1',
                        'label' => 'Local Network 192.168.1.0/24',
                        'range_value' => '192.168.1.0/24',
                        'range_type' => 'cidr',
                        'port' => 9100,
                        'source' => 'auto_range',
                        'source_label' => 'Auto Local Range',
                        'scanned_hosts' => 254,
                        'found_count' => 1,
                        'status' => 'scanned',
                        'message' => 'Scan completed successfully.',
                        'duration_ms' => 145,
                    ]],
                    'summary' => [
                        'duration_ms' => 145,
                        'ranges_scanned' => 1,
                        'printers_found' => 1,
                    ],
                ];
            }
        };

        $controller = new PrinterTestController(
            app(KitchenPrinterResolver::class),
            $service,
            app(PrinterConnectorFactory::class),
        );
        $request = Request::create('/settings/printers/discover', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $response = $controller->discover($request);
        $payload = $response->getData(true);

        $this->assertTrue($payload['success']);
        $this->assertCount(1, $payload['printers']);
        $this->assertSame('192.168.1.50', $payload['printers'][0]['printer_ip']);
        $this->assertSame(9100, $payload['printers'][0]['printer_port']);
        $this->assertSame('found', $payload['printers'][0]['status']);
        $this->assertSame(1, $payload['sources']['network_scan']['found_count']);
        $this->assertSame(1, $payload['summary']['ranges_scanned']);
        $this->assertCount(1, $payload['scan_ranges']);
    }
}
