<?php

namespace App\Http\Middleware;

use App\Services\OperationalAuditLogger;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OperationalMutationAudit
{
    public function __construct(
        private readonly OperationalAuditLogger $auditLogger
    ) {
    }

    public function handle(Request $request, Closure $next)
    {
        if (!$this->shouldAudit($request)) {
            return $next($request);
        }

        $routeName = (string) ($request->route()?->getName() ?? '');
        [$entityType, $entityId] = $this->resolveEntity($request);
        $actionBase = $this->resolveActionBase($request, $routeName);
        $module = $this->resolveModule($request);
        $correlationId = (string) ($request->attributes->get('correlation_id') ?: Str::uuid()->toString());

        $request->attributes->set('correlation_id', $correlationId);

        $baseContext = [
            'route_name' => $routeName,
            'method' => $request->method(),
            'url' => $request->fullUrl(),
        ];

        $this->auditLogger->record([
            'correlation_id' => $correlationId,
            'module' => $module,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'action' => "{$actionBase}.attempted",
            'status' => 'attempted',
            'severity' => 'info',
            'message' => 'Mutation request started.',
            'context' => $baseContext,
        ]);

        $response = $next($request);

        $statusCode = (int) $response->getStatusCode();
        if ($statusCode < 400) {
            $this->auditLogger->record([
                'correlation_id' => $correlationId,
                'module' => $module,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => "{$actionBase}.succeeded",
                'status' => 'succeeded',
                'severity' => 'info',
                'message' => 'Mutation request completed.',
                'context' => $baseContext + ['status_code' => $statusCode],
            ]);
        } else {
            $this->auditLogger->record([
                'correlation_id' => $correlationId,
                'module' => $module,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'action' => "{$actionBase}.failed",
                'status' => 'failed',
                'severity' => $statusCode >= 500 ? 'error' : 'warning',
                'message' => 'Mutation request returned an error response.',
                'context' => $baseContext + ['status_code' => $statusCode],
            ]);
        }

        return $response;
    }

    private function shouldAudit(Request $request): bool
    {
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return false;
        }

        $path = (string) $request->path();
        return str_starts_with($path, 'admin/accounting')
            || str_starts_with($path, 'admin/procurement')
            || str_starts_with($path, 'admin/inventory');
    }

    private function resolveModule(Request $request): string
    {
        $path = (string) $request->path();
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

    private function resolveActionBase(Request $request, string $routeName): string
    {
        if ($routeName !== '') {
            return str_replace('_', '-', $routeName);
        }

        return strtolower($request->method()) . '.' . str_replace('/', '.', trim((string) $request->path(), '/'));
    }

    private function resolveEntity(Request $request): array
    {
        $route = $request->route();
        if (!$route) {
            return [null, null];
        }

        $parameters = $route->parameters();
        foreach ($parameters as $name => $value) {
            if (is_scalar($value)) {
                return [(string) $name, (string) $value];
            }

            if (is_object($value) && method_exists($value, 'getKey')) {
                return [class_basename($value), (string) $value->getKey()];
            }
        }

        return [null, null];
    }
}

