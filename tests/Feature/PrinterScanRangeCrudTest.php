<?php

namespace Tests\Feature;

use App\Http\Controllers\PrinterTestController;
use App\Models\PrinterScanRange;
use App\Services\Printing\KitchenPrinterResolver;
use App\Services\Printing\PrinterConnectorFactory;
use App\Services\Printing\PrinterDiscoveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class PrinterScanRangeCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_scan_range_crud_persists_network_range_settings(): void
    {
        $controller = new PrinterTestController(
            app(KitchenPrinterResolver::class),
            app(PrinterDiscoveryService::class),
            app(PrinterConnectorFactory::class),
        );

        $storeRequest = Request::create('/settings/printers/scan-ranges', 'POST', [
            'label' => 'Kitchen VLAN',
            'range_value' => '10.0.8.0/24',
            'range_type' => 'cidr',
            'port' => 9100,
            'is_active' => true,
        ]);
        $storeRequest->setLaravelSession($this->app['session']->driver());

        $storeResponse = $controller->storeScanRange($storeRequest);
        $stored = $storeResponse->getData(true)['scan_range'];

        $this->assertSame('Kitchen VLAN', $stored['label']);
        $this->assertDatabaseHas('printer_scan_ranges', [
            'label' => 'Kitchen VLAN',
            'range_value' => '10.0.8.0/24',
        ]);

        $scanRange = PrinterScanRange::query()->firstOrFail();

        $updateRequest = Request::create("/settings/printers/scan-ranges/{$scanRange->id}", 'PUT', [
            'label' => 'Kitchen VLAN A',
            'range_value' => '10.0.8.20-10.0.8.60',
            'range_type' => 'range',
            'port' => 9100,
            'is_active' => false,
        ]);
        $updateRequest->setLaravelSession($this->app['session']->driver());

        $controller->updateScanRange($updateRequest, $scanRange);

        $this->assertDatabaseHas('printer_scan_ranges', [
            'id' => $scanRange->id,
            'label' => 'Kitchen VLAN A',
            'range_value' => '10.0.8.20-10.0.8.60',
            'range_type' => 'range',
            'is_active' => 0,
        ]);

        $deleteRequest = Request::create("/settings/printers/scan-ranges/{$scanRange->id}", 'DELETE');
        $deleteRequest->setLaravelSession($this->app['session']->driver());

        $controller->destroyScanRange($deleteRequest, $scanRange->fresh());

        $this->assertDatabaseMissing('printer_scan_ranges', [
            'id' => $scanRange->id,
        ]);
    }
}
