<?php

namespace App\Services\Procurement;

use App\Models\Setting;

class ProcurementPolicyService
{
    public const BILL_REQUIRES_GRN = 'bill_requires_grn';
    public const VALUATION_METHOD = 'valuation_method';
    public const PO_AMENDMENT_MODE = 'po_amendment_mode';

    public function all(): array
    {
        $stored = Setting::getGroup('procurement_policy');

        return [
            self::BILL_REQUIRES_GRN => (bool) ($stored[self::BILL_REQUIRES_GRN] ?? true),
            self::VALUATION_METHOD => $this->normalizeValuationMethod((string) ($stored[self::VALUATION_METHOD] ?? 'fifo')),
            self::PO_AMENDMENT_MODE => $this->normalizePoAmendmentMode((string) ($stored[self::PO_AMENDMENT_MODE] ?? 'admin_prospective')),
        ];
    }

    public function billRequiresGrn(): bool
    {
        return (bool) $this->all()[self::BILL_REQUIRES_GRN];
    }

    public function valuationMethod(): string
    {
        return (string) $this->all()[self::VALUATION_METHOD];
    }

    public function poAmendmentMode(): string
    {
        return (string) $this->all()[self::PO_AMENDMENT_MODE];
    }

    public function update(array $payload): array
    {
        $merged = array_merge($this->all(), $payload);
        $normalized = [
            self::BILL_REQUIRES_GRN => (bool) ($merged[self::BILL_REQUIRES_GRN] ?? true),
            self::VALUATION_METHOD => $this->normalizeValuationMethod((string) ($merged[self::VALUATION_METHOD] ?? 'fifo')),
            self::PO_AMENDMENT_MODE => $this->normalizePoAmendmentMode((string) ($merged[self::PO_AMENDMENT_MODE] ?? 'admin_prospective')),
        ];

        Setting::updateGroup('procurement_policy', $normalized);

        return $normalized;
    }

    private function normalizeValuationMethod(string $method): string
    {
        return in_array($method, ['fifo', 'weighted_average'], true) ? $method : 'fifo';
    }

    private function normalizePoAmendmentMode(string $mode): string
    {
        return in_array($mode, ['disabled', 'admin_prospective'], true) ? $mode : 'admin_prospective';
    }
}
