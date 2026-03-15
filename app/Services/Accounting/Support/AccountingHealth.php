<?php

namespace App\Services\Accounting\Support;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

class AccountingHealth
{
    public function status(array $requiredTables = [], array $optionalTables = []): array
    {
        $missingRequired = array_values(array_filter($requiredTables, fn (string $table) => !Schema::hasTable($table)));
        $missingOptional = array_values(array_filter($optionalTables, fn (string $table) => !Schema::hasTable($table)));

        return [
            'ready' => count($missingRequired) === 0,
            'missing_required' => $missingRequired,
            'missing_optional' => $missingOptional,
        ];
    }

    public function emptyPaginator(Request $request, int $perPage = 25): LengthAwarePaginator
    {
        return new LengthAwarePaginator(
            collect(),
            0,
            $perPage,
            max(1, (int) $request->input('page', 1)),
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    public function safeRoute(string $name, array $parameters = []): ?string
    {
        if (!Route::has($name)) {
            return null;
        }

        return route($name, $parameters);
    }

    public function setupMessage(string $feature, array $missingRequired = [], array $missingOptional = []): string
    {
        if (!empty($missingRequired)) {
            return sprintf(
                '%s is not fully configured yet. Missing required tables: %s.',
                $feature,
                implode(', ', $missingRequired)
            );
        }

        if (!empty($missingOptional)) {
            return sprintf(
                '%s is available, but some optional features are unavailable because these tables are missing: %s.',
                $feature,
                implode(', ', $missingOptional)
            );
        }

        return $feature . ' is available.';
    }
}
