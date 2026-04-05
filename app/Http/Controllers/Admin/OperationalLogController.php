<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OperationalAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OperationalLogController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = OperationalAuditLog::query()->with('actor:id,name,email');

        if ($request->filled('module')) {
            $query->where('module', (string) $request->input('module'));
        }
        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }
        if ($request->filled('severity')) {
            $query->where('severity', (string) $request->input('severity'));
        }
        if ($request->filled('entity_type')) {
            $query->where('entity_type', (string) $request->input('entity_type'));
        }
        if ($request->filled('entity_id')) {
            $query->where('entity_id', (string) $request->input('entity_id'));
        }
        if ($request->filled('correlation_id')) {
            $query->where('correlation_id', 'like', '%' . trim((string) $request->input('correlation_id')) . '%');
        }
        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->input('to'));
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhere('request_path', 'like', "%{$search}%");
            });
        }

        $logs = $query->latest('id')->paginate($perPage)->withQueryString();
        $summaryQuery = clone $query;

        return Inertia::render('App/Admin/Operations/Logs/Index', [
            'logs' => $logs,
            'summary' => [
                'total' => (int) $summaryQuery->count(),
                'failed' => (int) (clone $summaryQuery)->where('status', 'failed')->count(),
                'critical' => (int) (clone $summaryQuery)->where('severity', 'critical')->count(),
                'warning' => (int) (clone $summaryQuery)->where('severity', 'warning')->count(),
            ],
            'filters' => $request->only([
                'module',
                'status',
                'severity',
                'entity_type',
                'entity_id',
                'correlation_id',
                'from',
                'to',
                'search',
                'per_page',
            ]),
            'options' => [
                'modules' => ['accounting', 'procurement', 'inventory', 'operations'],
                'statuses' => ['attempted', 'validated', 'persisted', 'posted', 'succeeded', 'failed'],
                'severities' => ['debug', 'info', 'warning', 'error', 'critical'],
            ],
        ]);
    }
}

