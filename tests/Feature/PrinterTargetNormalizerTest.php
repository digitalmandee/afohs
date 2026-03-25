<?php

namespace Tests\Feature;

use App\Services\Printing\PrinterTargetNormalizer;
use Tests\TestCase;

class PrinterTargetNormalizerTest extends TestCase
{
    public function test_it_normalizes_network_printer_payloads(): void
    {
        $normalized = app(PrinterTargetNormalizer::class)->normalize([
            'printer_source' => 'network_scan',
            'printer_ip' => '192.168.1.77',
            'printer_port' => 9100,
        ], false);

        $this->assertSame('network_scan', $normalized['printer_source']);
        $this->assertSame('192.168.1.77', $normalized['printer_ip']);
        $this->assertSame(9100, $normalized['printer_port']);
        $this->assertNull($normalized['printer_name']);
    }

    public function test_it_normalizes_system_printer_payloads(): void
    {
        $normalized = app(PrinterTargetNormalizer::class)->normalize([
            'printer_source' => 'system_printer',
            'printer_name' => 'Receipt_Printer',
            'printer_connector' => 'cups',
        ], false);

        $this->assertSame('system_printer', $normalized['printer_source']);
        $this->assertSame('Receipt_Printer', $normalized['printer_name']);
        $this->assertSame('cups', $normalized['printer_connector']);
        $this->assertNull($normalized['printer_ip']);
    }
}
