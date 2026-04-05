<?php

namespace App\Services;

use App\Models\OperationalAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class OperationalAuditLogger
{
    private const DEDUPE_WINDOW_SECONDS = 45;
    private const MAX_CONTEXT_LENGTH = 12000;
    private const MASKED_KEYS = [
        'password',
        'password_confirmation',
        'token',
        '_token',
        'authorization',
        'cookie',
        'secret',
        'api_key',
    ];

    public function record(array $input): ?OperationalAuditLog
    {
        $request = request();
        $module = $this->normalizeModule($input['module'] ?? null, $request);
        $severity = $this->normalizeSeverity($input['severity'] ?? 'info');
        $status = (string) ($input['status'] ?? 'attempted');
        $message = $this->truncate((string) ($input['message'] ?? 'Operational audit event'), 2000);
        $action = (string) ($input['action'] ?? 'system.event');
        $entityType = $this->truncateNullable($input['entity_type'] ?? null, 120);
        $entityId = $this->truncateNullable(isset($input['entity_id']) ? (string) $input['entity_id'] : null, 120);
        $correlationId = $this->resolveCorrelationId($input['correlation_id'] ?? null, $request);
        $actorId = $this->resolveActorId($input['actor_id'] ?? null);
        $requestPath = $this->truncateNullable($input['request_path'] ?? ($request?->path()), 255);
        $ip = $this->truncateNullable($input['ip'] ?? ($request?->ip()), 45);
        $context = $this->sanitizeContext($input['context'] ?? []);
        $signature = hash('sha256', implode('|', [
            $module,
            $action,
            $status,
            $entityType ?: '-',
            $entityId ?: '-',
            $message,
        ]));

        try {
            if ($this->isDuplicate($module, $entityType, $entityId, $action, $status, $signature)) {
                $this->writeChannelLog($module, 'debug', 'operations.audit.duplicate_skipped', [
                    'correlation_id' => $correlationId,
                    'module' => $module,
                    'action' => $action,
                    'status' => $status,
                    'entity_type' => $entityType,
                    'entity_id' => $entityId,
                ]);
                return null;
            }

            $log = OperationalAuditLog::query()->create([
                'correlation_id' => $correlationId,
                'module' => $module,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => $action,
                'status' => $status,
                'severity' => $severity,
                'message' => $message,
                'context_json' => $context,
                'actor_id' => $actorId,
                'request_path' => $requestPath,
                'ip' => $ip,
                'error_signature' => $signature,
            ]);

            $this->writeChannelLog($module, $severity, 'operations.audit.recorded', [
                'audit_log_id' => $log->id,
                'correlation_id' => $correlationId,
                'module' => $module,
                'action' => $action,
                'status' => $status,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'message' => $message,
                'context' => $context,
            ]);

            return $log;
        } catch (\Throwable $e) {
            $this->writeChannelLog('operations', 'error', 'operations.audit.write_failed', [
                'correlation_id' => $correlationId,
                'module' => $module,
                'action' => $action,
                'status' => $status,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    private function isDuplicate(string $module, ?string $entityType, ?string $entityId, string $action, string $status, string $signature): bool
    {
        return OperationalAuditLog::query()
            ->where('module', $module)
            ->where('action', $action)
            ->where('status', $status)
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->where('error_signature', $signature)
            ->where('created_at', '>=', now()->subSeconds(self::DEDUPE_WINDOW_SECONDS))
            ->exists();
    }

    private function resolveCorrelationId(?string $correlationId, ?Request $request): ?string
    {
        if ($correlationId && trim($correlationId) !== '') {
            return $this->truncate(trim($correlationId), 100);
        }

        $requestCorrelation = $request?->attributes->get('correlation_id')
            ?: $request?->header('X-Correlation-ID');

        return $requestCorrelation ? $this->truncate((string) $requestCorrelation, 100) : null;
    }

    private function resolveActorId(mixed $actorId): ?int
    {
        if (is_numeric($actorId) && (int) $actorId > 0) {
            return (int) $actorId;
        }

        $authId = Auth::id();
        return $authId ? (int) $authId : null;
    }

    private function normalizeModule(?string $module, ?Request $request): string
    {
        if ($module && trim($module) !== '') {
            return strtolower(trim($module));
        }

        $path = (string) ($request?->path() ?? '');
        if (str_starts_with($path, 'admin/accounting')) {
            return 'accounting';
        }
        if (str_starts_with($path, 'admin/procurement')) {
            return 'procurement';
        }
        if (str_starts_with($path, 'admin/inventory')) {
            return 'inventory';
        }

        return 'operations';
    }

    private function normalizeSeverity(string $severity): string
    {
        $severity = strtolower(trim($severity));
        return in_array($severity, ['debug', 'info', 'warning', 'error', 'critical'], true) ? $severity : 'info';
    }

    private function sanitizeContext(mixed $context): array
    {
        if (!is_array($context)) {
            $context = ['raw' => (string) $context];
        }

        $masked = $this->maskSensitive($context);
        $encoded = json_encode($masked);
        if ($encoded === false) {
            return ['notice' => 'Context could not be encoded'];
        }

        if (strlen($encoded) <= self::MAX_CONTEXT_LENGTH) {
            return $masked;
        }

        return [
            'truncated' => true,
            'preview' => substr($encoded, 0, self::MAX_CONTEXT_LENGTH),
        ];
    }

    private function maskSensitive(array $context): array
    {
        $result = [];
        foreach ($context as $key => $value) {
            $keyString = strtolower((string) $key);
            if ($this->shouldMask($keyString)) {
                $result[$key] = '***';
                continue;
            }

            if (is_array($value)) {
                $result[$key] = $this->maskSensitive($value);
                continue;
            }

            if (is_string($value)) {
                $result[$key] = $this->truncate($value, 1200);
                continue;
            }

            $result[$key] = $value;
        }

        return $result;
    }

    private function shouldMask(string $key): bool
    {
        foreach (self::MASKED_KEYS as $candidate) {
            if (str_contains($key, $candidate)) {
                return true;
            }
        }
        return false;
    }

    private function writeChannelLog(string $module, string $level, string $message, array $context): void
    {
        $channel = match ($module) {
            'accounting' => 'accounting',
            'procurement' => 'procurement',
            'inventory' => 'inventory',
            default => 'operations',
        };

        Log::channel($channel)->{$level}($message, $context);
    }

    private function truncate(string $value, int $length): string
    {
        return mb_strlen($value) > $length ? mb_substr($value, 0, $length - 3) . '...' : $value;
    }

    private function truncateNullable(?string $value, int $length): ?string
    {
        if ($value === null) {
            return null;
        }
        return $this->truncate((string) $value, $length);
    }
}

