<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequestLogContext;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Application;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedByPathException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'check.web' => \App\Http\Middleware\CheckWebRolePermission::class,
            'super.admin' => \App\Http\Middleware\CheckSuperAdminPermission::class,
            'pos.tenancy' => \App\Http\Middleware\InitializePosTenancy::class,
        ]);
        $middleware->web(append: [
            RequestLogContext::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('pos') || $request->is('pos/*')) {
                return route('pos.login');
            }

            return route('login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->report(function (\Throwable $e) {
            $request = request();

            if (!$request instanceof Request) {
                return;
            }

            $route = $request->route();
            $path = (string) $request->path();
            $routeName = $route?->getName();
            $controllerAction = $route?->getActionName();
            $tenantId = $request->input('tenant_id')
                ?? $request->input('restaurant_id')
                ?? $route?->parameter('tenant')
                ?? $route?->parameter('tenant_id');

            $sanitizeInput = function (Request $request): array {
                return $request->except([
                    'password',
                    'password_confirmation',
                    'token',
                    '_token',
                    'current_password',
                    'new_password',
                    'new_password_confirmation',
                ]);
            };

            $extractSqlContext = function (\Throwable $exception): array {
                if (!$exception instanceof QueryException) {
                    return [
                        'sql_state' => null,
                        'error_code' => null,
                    ];
                }

                $sqlState = null;
                $errorCode = null;
                $previous = $exception->getPrevious();

                if ($previous instanceof \PDOException) {
                    $sqlState = $previous->errorInfo[0] ?? $exception->getCode();
                    $errorCode = $previous->errorInfo[1] ?? null;
                } else {
                    $sqlState = $exception->getCode();
                }

                return [
                    'sql_state' => $sqlState,
                    'error_code' => $errorCode,
                ];
            };

            $sqlContext = $extractSqlContext($e);

            Log::error('Unhandled application exception', [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'tenant_id' => $tenantId,
                'route_name' => $routeName,
                'controller_action' => $controllerAction,
                'path' => $path,
                'method' => $request->method(),
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'sql_state' => $sqlContext['sql_state'],
                'error_code' => $sqlContext['error_code'],
            ]);

            $baseContext = [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'tenant_id' => $tenantId,
                'route_name' => $routeName,
                'controller_action' => $controllerAction,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'path' => $path,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'sql_state' => $sqlContext['sql_state'],
                'error_code' => $sqlContext['error_code'],
                'input' => $sanitizeInput($request),
            ];

            if (str_starts_with($path, 'admin/accounting')) {
                Log::channel('accounting')->error('Accounting module exception', $baseContext);
            }

            if (str_starts_with($path, 'admin/procurement')) {
                Log::channel('procurement')->error('Procurement module exception', $baseContext);
            }

            if (str_starts_with($path, 'admin/inventory')) {
                Log::channel('inventory')->error('inventory.exception.unhandled', $baseContext);
            }
        });

        $exceptions->context(function (\Throwable $e) {
            $request = request();

            if (!$request instanceof Request) {
                return [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                ];
            }

            return [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'route_name' => $request->route()?->getName(),
                'controller_action' => $request->route()?->getActionName(),
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'exception' => get_class($e),
            ];
        });

        $exceptions->render(function (TenantCouldNotBeIdentifiedByPathException $e, $request) {
            Log::channel('inventory')->warning('navigation.tenant_path_unresolved', [
                'event' => 'navigation.tenant_path_unresolved',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'route_name' => $request->route()?->getName(),
                'path' => (string) $request->path(),
                'url' => $request->fullUrl(),
                'referrer' => $request->headers->get('referer'),
                'route_source' => $request->headers->get('x-route-source'),
                'user_agent' => $request->userAgent(),
                'message' => $e->getMessage(),
            ]);

            return Inertia::render('Errors/TenantNotFound', [
                'message' => 'The tenant you are looking for does not exist.'
            ])->toResponse($request)->setStatusCode(404);
        });
    })
    ->create();
