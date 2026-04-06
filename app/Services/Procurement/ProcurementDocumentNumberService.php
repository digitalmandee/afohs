<?php

namespace App\Services\Procurement;

use App\Models\Branch;
use App\Models\ProcurementDocumentSequence;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcurementDocumentNumberService
{
    private const TYPES = ['PO', 'GRN', 'PINV'];

    public function generate(string $documentType, int $branchId, mixed $documentDate = null): string
    {
        $type = strtoupper(trim($documentType));
        if (!in_array($type, self::TYPES, true)) {
            throw ValidationException::withMessages([
                'document_type' => 'Unsupported procurement document type for numbering.',
            ]);
        }

        $date = $documentDate ? Carbon::parse($documentDate) : now();
        $periodYm = $date->format('ym');

        return DB::transaction(function () use ($type, $branchId, $periodYm) {
            $branch = Branch::query()
                ->lockForUpdate()
                ->find($branchId, ['id', 'name', 'branch_code']);

            if (!$branch) {
                throw ValidationException::withMessages([
                    'branch_id' => 'Branch not found for document numbering.',
                ]);
            }

            $branchCode = strtoupper(trim((string) ($branch->branch_code ?? '')));
            if ($branchCode === '') {
                $branchCode = $this->generateFallbackBranchCode($branch->id, (string) ($branch->name ?? ''));
                $branch->branch_code = $branchCode;
                $branch->save();
            }

            $sequence = ProcurementDocumentSequence::query()
                ->where('branch_id', $branchId)
                ->where('document_type', $type)
                ->where('period_ym', $periodYm)
                ->lockForUpdate()
                ->first();

            if (!$sequence) {
                $sequence = ProcurementDocumentSequence::query()->create([
                    'branch_id' => $branchId,
                    'document_type' => $type,
                    'period_ym' => $periodYm,
                    'last_number' => 0,
                ]);
            }

            $next = (int) $sequence->last_number + 1;
            $sequence->update(['last_number' => $next]);

            return sprintf('%s-%s-%s-%04d', $branchCode, $type, $periodYm, $next);
        }, 5);
    }

    private function generateFallbackBranchCode(int $branchId, string $branchName): string
    {
        $normalized = strtoupper(preg_replace('/[^A-Z0-9]/', '', strtoupper($branchName)) ?? '');
        $base = $normalized !== '' ? substr($normalized, 0, 8) : 'BR' . $branchId;
        $candidate = $base;
        $suffix = 1;

        while (
            Branch::query()
                ->whereRaw('UPPER(branch_code) = ?', [$candidate])
                ->where('id', '!=', $branchId)
                ->exists()
        ) {
            $candidate = substr($base, 0, 6) . str_pad((string) $suffix, 2, '0', STR_PAD_LEFT);
            $suffix++;
        }

        return $candidate;
    }
}
