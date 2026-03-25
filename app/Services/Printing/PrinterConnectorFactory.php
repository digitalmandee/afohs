<?php

namespace App\Services\Printing;

use InvalidArgumentException;
use Mike42\Escpos\PrintConnectors\CupsPrintConnector;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

class PrinterConnectorFactory
{
    /**
     * @param  array<string, mixed>  $target
     */
    public function create(array $target): object
    {
        $source = (string) ($target['printer_source'] ?? $target['source'] ?? 'network_scan');

        if ($source === 'system_printer') {
            $printerName = trim((string) ($target['printer_name'] ?? ''));
            if ($printerName === '') {
                throw new InvalidArgumentException('System printer name is missing.');
            }

            $connector = (string) ($target['printer_connector'] ?? (PHP_OS_FAMILY === 'Windows' ? 'windows' : 'cups'));

            return $connector === 'windows'
                ? new WindowsPrintConnector($printerName)
                : new CupsPrintConnector($printerName);
        }

        $ip = trim((string) ($target['printer_ip'] ?? ''));
        if ($ip === '') {
            throw new InvalidArgumentException('Network printer IP is missing.');
        }

        return new NetworkPrintConnector(
            $ip,
            (int) ($target['printer_port'] ?? 9100) ?: 9100,
            5
        );
    }
}
