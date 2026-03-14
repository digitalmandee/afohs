<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
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

        $users = User::whereIn('id', $actions->pluck('action_by')->filter()->unique())->pluck('name', 'id');

        $payload = $actions->map(function ($action) use ($users) {
            return [
                'id' => $action->id,
                'action' => $action->action,
                'remarks' => $action->remarks,
                'action_by' => $action->action_by,
                'action_by_name' => $action->action_by ? ($users[$action->action_by] ?? null) : null,
                'created_at' => $action->created_at,
            ];
        });

        return response()->json([
            'actions' => $payload,
        ]);
    }
}
