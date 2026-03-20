<?php

namespace Tests\Feature;

use App\Http\Controllers\PrinterTestController;
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
            public function discover(?int $restaurantId = null): array
            {
                return [[
                    'id' => '192.168.1.50:9100',
                    'label' => 'Kitchen Printer 1',
                    'printer_ip' => '192.168.1.50',
                    'printer_port' => 9100,
                    'source' => 'network_scan',
                    'last_seen' => now()->toIso8601String(),
                    'status' => 'found',
                    'assignment_label' => null,
                ]];
            }
        };

        $controller = new PrinterTestController(app(KitchenPrinterResolver::class), $service);
        $request = Request::create('/settings/printers/discover', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $response = $controller->discover($request);
        $payload = $response->getData(true);

        $this->assertTrue($payload['success']);
        $this->assertCount(1, $payload['printers']);
        $this->assertSame('192.168.1.50', $payload['printers'][0]['printer_ip']);
        $this->assertSame(9100, $payload['printers'][0]['printer_port']);
        $this->assertSame('found', $payload['printers'][0]['status']);
    }
}
