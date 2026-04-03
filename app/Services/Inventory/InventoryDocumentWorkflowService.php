<?php

namespace App\Services\Inventory;

use App\Models\AccountingEventQueue;
use App\Models\ApprovalAction;
use App\Models\DepartmentInventoryBalance;
use App\Models\DepartmentInventoryTransaction;
use App\Models\InventoryDocument;
use App\Models\InventoryDocumentTypeConfig;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryDocumentWorkflowService
{
    public function getTypeConfig(string $type): ?InventoryDocumentTypeConfig
    {
        return InventoryDocumentTypeConfig::query()
            ->where('code', $this->normalizeConfigCode($type))
            ->where('is_active', true)
            ->first();
    }

    public function requiresApproval(string $type): bool
    {
        $config = $this->getTypeConfig($type);
        return $config?->approval_required ?? true;
    }

    public function canAutoPost(string $type): bool
    {
        $config = $this->getTypeConfig($type);
        return (bool) ($config?->auto_post ?? false);
    }

    public function shouldAutoPostOnCreate(string $type): bool
    {
        return !$this->requiresApproval($type) && $this->canAutoPost($type);
    }

    public function resolveWorkflowState(InventoryDocument $document): string
    {
        if ($document->status === 'posted' || $document->posted_at) {
            return 'posted';
        }

        if ($document->approval_status === 'rejected' || $document->status === 'void') {
            return 'rejected';
        }

        if ($document->approval_status === 'submitted') {
            return 'awaiting_approval';
        }

        return 'draft';
    }

    public function nextDocumentNumber(string $code): string
    {
        return DB::transaction(function () use ($code) {
            $config = InventoryDocumentTypeConfig::query()
                ->where('code', $code)
                ->where('is_active', true)
                ->lockForUpdate()
                ->firstOrFail();

            $config->sequence = (int) $config->sequence + 1;
            $config->save();

            $prefix = $config->prefix ?: strtoupper(substr($code, 0, 3));
            return sprintf('%s-%s-%05d', $prefix, now()->format('Ymd'), $config->sequence);
        });
    }

    public function submitDocument(InventoryDocument $document, ?int $userId = null): InventoryDocument
    {
        if (!$this->requiresApproval($document->type)) {
            throw ValidationException::withMessages([
                'document' => 'Approval is not required for this document type.',
            ]);
        }

        if ($document->approval_status !== 'draft' && $document->approval_status !== 'rejected') {
            throw ValidationException::withMessages([
                'document' => 'Only draft or rejected documents can be submitted.',
            ]);
        }

        $document->update([
            'approval_status' => 'submitted',
            'submitted_at' => now(),
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'inventory_document',
            'document_id' => $document->id,
            'action' => 'submitted',
            'remarks' => 'Document submitted for approval.',
            'action_by' => $userId,
        ]);

        return $document->refresh();
    }

    public function approveDocument(InventoryDocument $document, ?int $userId = null): InventoryDocument
    {
        if ($this->requiresApproval($document->type) && $document->approval_status !== 'submitted') {
            throw ValidationException::withMessages([
                'document' => 'This document must be submitted before approval.',
            ]);
        }

        if (!$this->requiresApproval($document->type) && !in_array($document->approval_status, ['draft', 'submitted', 'approved'], true)) {
            throw ValidationException::withMessages([
                'document' => 'This document cannot be approved in its current state.',
            ]);
        }

        $document->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $userId,
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'inventory_document',
            'document_id' => $document->id,
            'action' => 'approved',
            'remarks' => 'Document approved.',
            'action_by' => $userId,
        ]);

        return $document->refresh();
    }

    public function rejectDocument(InventoryDocument $document, ?int $userId = null, ?string $remarks = null): InventoryDocument
    {
        if (!in_array($document->approval_status, ['submitted', 'draft', 'approved'], true)) {
            throw ValidationException::withMessages([
                'document' => 'This document cannot be rejected in its current state.',
            ]);
        }

        $document->update([
            'approval_status' => 'rejected',
            'status' => 'void',
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'inventory_document',
            'document_id' => $document->id,
            'action' => 'rejected',
            'remarks' => $remarks ?: 'Document rejected.',
            'action_by' => $userId,
        ]);

        return $document->refresh();
    }

    public function maybeQueueAccountingEvent(InventoryDocument $document): void
    {
        $config = $this->getTypeConfig($document->type);

        if (!$config || !$config->accounting_enabled) {
            return;
        }

        $idempotencyKey = sprintf('inventory-document:%s:posted', $document->id);
        if (AccountingEventQueue::query()->where('idempotency_key', $idempotencyKey)->exists()) {
            return;
        }

        AccountingEventQueue::query()->create([
            'module_type' => 'inventory_document',
            'module_id' => $document->id,
            'event_type' => 'document_posted',
            'status' => 'pending',
            'payload' => [
                'document_no' => $document->document_no,
                'document_type' => $document->type,
                'tenant_id' => $document->tenant_id,
            ],
            'occurred_at' => now(),
            'idempotency_key' => $idempotencyKey,
            'attempts' => 0,
        ]);
    }

    public function applyDepartmentMovement(array $payload): void
    {
        $qtyIn = (float) ($payload['qty_in'] ?? 0);
        $qtyOut = (float) ($payload['qty_out'] ?? 0);
        $unitCost = (float) ($payload['unit_cost'] ?? 0);
        $deltaQty = $qtyIn - $qtyOut;
        $deltaValue = $deltaQty * $unitCost;

        DepartmentInventoryTransaction::query()->create([
            'tenant_id' => $payload['tenant_id'] ?? null,
            'department_id' => $payload['department_id'],
            'subdepartment_id' => $payload['subdepartment_id'] ?? null,
            'inventory_item_id' => $payload['inventory_item_id'],
            'transaction_date' => $payload['transaction_date'],
            'type' => $payload['type'],
            'qty_in' => $qtyIn,
            'qty_out' => $qtyOut,
            'unit_cost' => $unitCost,
            'total_cost' => abs($deltaValue),
            'reference_type' => $payload['reference_type'] ?? null,
            'reference_id' => $payload['reference_id'] ?? null,
            'remarks' => $payload['remarks'] ?? null,
            'created_by' => $payload['created_by'] ?? null,
        ]);

        $balance = DepartmentInventoryBalance::query()->firstOrCreate(
            [
                'tenant_id' => $payload['tenant_id'] ?? null,
                'department_id' => $payload['department_id'],
                'subdepartment_id' => $payload['subdepartment_id'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'],
            ],
            [
                'current_qty' => 0,
                'current_value' => 0,
            ]
        );

        $nextQty = (float) $balance->current_qty + $deltaQty;
        if ($nextQty < -0.0001) {
            $inventoryItem = InventoryItem::query()->find($payload['inventory_item_id']);
            throw ValidationException::withMessages([
                'quantity' => 'Department stock is insufficient for ' . ($inventoryItem?->name ?: 'this item') . '.',
            ]);
        }

        $balance->update([
            'current_qty' => $nextQty,
            'current_value' => (float) $balance->current_value + $deltaValue,
        ]);
    }

    private function normalizeConfigCode(string $type): string
    {
        return match ($type) {
            'transfer' => 'warehouse_transfer',
            'adjustment' => 'stock_adjustment',
            default => $type,
        };
    }
}
