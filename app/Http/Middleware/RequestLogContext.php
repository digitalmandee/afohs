<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RequestLogContext
{
    public function handle(Request $request, Closure $next)
    {
        $requestId = $request->header('X-Request-Id') ?: (string) Str::uuid();
        $correlationId = $request->header('X-Correlation-ID') ?: (string) Str::uuid();

        $request->attributes->set('request_id', $requestId);
        $request->attributes->set('correlation_id', $correlationId);

        Log::withContext([
            'request_id' => $requestId,
            'correlation_id' => $correlationId,
            'method' => $request->method(),
            'path' => $request->path(),
        ]);

        $response = $next($request);

        $response->headers->set('X-Request-Id', $requestId);
        $response->headers->set('X-Correlation-ID', $correlationId);

        return $response;
    }
}
