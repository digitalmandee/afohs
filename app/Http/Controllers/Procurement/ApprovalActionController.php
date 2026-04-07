<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\OperationalAuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class ApprovalActionController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'document_type' => 'required|string|max:64',
            'document_id' => 'required|integer|min:1',
        ]);

        $actions = ApprovalAction::query()
            ->where('document_type', $data['document_type'])
            ->where('document_id', $data['document_id'])
            ->orderByDesc('id')
            ->get();

        $operationalEvents = $this->loadOperationalEvents($data['document_type'], (int) $data['document_id']);

        $users = User::whereIn('id', $actions->pluck('action_by')->filter()->unique()->merge($operationalEvents->pluck('actor_id')->filter()->unique()))
            ->pluck('name', 'id');

        $workflowPayload = $actions->map(function ($action) use ($users) {
            return [
                'id' => $action->id,
                'action' => $action->action,
                'remarks' => $action->remarks,
                'action_by' => $action->action_by,
                'action_by_name' => $action->action_by ? ($users[$action->action_by] ?? null) : null,
                'created_at' => $action->created_at,
                'sort_at' => optional($action->created_at)->timestamp ?? 0,
            ];
        });

        $operationalPayload = $operationalEvents->map(function (OperationalAuditLog $log) use ($users) {
            return [
                'id' => 'log-' . $log->id,
                'action' => (string) (data_get($log->context_json, 'display_action') ?: $log->action),
                'remarks' => $log->message,
                'action_by' => $log->actor_id,
                'action_by_name' => $log->actor_id ? ($users[$log->actor_id] ?? null) : null,
                'created_at' => $log->created_at,
                'sort_at' => optional($log->created_at)->timestamp ?? 0,
            ];
        });

        $payload = $workflowPayload
            ->concat($operationalPayload)
            ->sortByDesc(fn ($row) => sprintf('%010d-%s', (int) ($row['sort_at'] ?? 0), (string) $row['id']))
            ->values()
            ->map(function ($row) {
                unset($row['sort_at']);
                return $row;
            });

        return response()->json([
            'actions' => $payload,
        ]);
    }

    private function loadOperationalEvents(string $documentType, int $documentId)
    {
        $entityType = match ($documentType) {
            'vendor_bill' => 'vendor_bill',
            'purchase_order' => 'purchase_order',
            'vendor_payment' => 'vendor_payment',
            default => null,
        };

        if (!$entityType) {
            return collect();
        }

        return OperationalAuditLog::query()
            ->where('module', 'procurement')
            ->where('entity_type', $entityType)
            ->where('entity_id', (string) $documentId)
            ->orderByDesc('id')
            ->get(['id', 'actor_id', 'action', 'message', 'context_json', 'created_at']);
    }
}
