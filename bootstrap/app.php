<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequestLogContext;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Application;
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

            Log::error('Unhandled application exception', [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'path' => $request->path(),
                'method' => $request->method(),
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            $path = (string) $request->path();
            $input = $request->except(['password', 'password_confirmation', 'token', '_token']);
            $baseContext = [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'path' => $path,
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'input' => $input,
            ];

            if (str_starts_with($path, 'admin/accounting')) {
                Log::channel('accounting')->error('Accounting module exception', $baseContext);
            }

            if (str_starts_with($path, 'admin/procurement')) {
                Log::channel('procurement')->error('Procurement module exception', $baseContext);
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
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
                'method' => $request->method(),
                'exception' => get_class($e),
            ];
        });

        $exceptions->render(function (TenantCouldNotBeIdentifiedByPathException $e, $request) {
            return Inertia::render('Errors/TenantNotFound', [
                'message' => 'The tenant you are looking for does not exist.'
            ])->toResponse($request)->setStatusCode(404);
        });
    })
    ->create();
