<?php

namespace App\Services\Printing;

use InvalidArgumentException;

class PrinterTargetNormalizer
{
    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>|null
     */
    public function normalize(array $input, bool $allowEmpty = true): ?array
    {
        $source = $this->resolveSource($input);
        $ip = trim((string) ($input['printer_ip'] ?? ''));
        $name = trim((string) ($input['printer_name'] ?? ''));

        if ($source === null && $allowEmpty && $ip === '' && $name === '') {
            return null;
        }

        if ($source === 'system_printer') {
            if ($name === '') {
                throw new InvalidArgumentException('System printer name is required.');
            }

            return [
                'printer_source' => 'system_printer',
                'printer_name' => $name,
                'printer_connector' => $this->resolveConnector((string) ($input['printer_connector'] ?? '')),
                'printer_ip' => null,
                'printer_port' => null,
            ];
        }

        if ($ip === '') {
            if ($allowEmpty) {
                return null;
            }

            throw new InvalidArgumentException('Printer IP is required.');
        }

        return [
            'printer_source' => 'network_scan',
            'printer_name' => null,
            'printer_connector' => null,
            'printer_ip' => $ip,
            'printer_port' => (int) ($input['printer_port'] ?? 9100) ?: 9100,
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     */
    protected function resolveSource(array $input): ?string
    {
        $source = trim((string) ($input['printer_source'] ?? ''));
        if (in_array($source, ['network_scan', 'system_printer'], true)) {
            return $source;
        }

        if (trim((string) ($input['printer_name'] ?? '')) !== '') {
            return 'system_printer';
        }

        if (trim((string) ($input['printer_ip'] ?? '')) !== '') {
            return 'network_scan';
        }

        return null;
    }

    protected function resolveConnector(string $connector): string
    {
        if (in_array($connector, ['cups', 'windows'], true)) {
            return $connector;
        }

        return PHP_OS_FAMILY === 'Windows' ? 'windows' : 'cups';
    }
}
