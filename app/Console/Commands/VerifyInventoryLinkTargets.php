<?php

namespace App\Console\Commands;

use App\Http\Controllers\Inventory\WarehouseController;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class VerifyInventoryLinkTargets extends Command
{
    protected $signature = 'inventory:verify-link-targets';

    protected $description = 'Smoke check key inventory link targets (warehouse pages) by invoking controller entry actions.';

    public function handle(): int
    {
        $targets = [
            [
                'route_name' => 'inventory.warehouses.index',
                'action' => [WarehouseController::class, 'index'],
                'method' => 'GET',
                'path' => 'admin/inventory/warehouses',
                'query' => ['per_page' => 10],
            ],
            [
                'route_name' => 'inventory.coverage.index',
                'action' => [WarehouseController::class, 'coverage'],
                'method' => 'GET',
                'path' => 'admin/inventory/coverage',
                'query' => [],
            ],
            [
                'route_name' => 'inventory.categories.index',
                'action' => [WarehouseController::class, 'categories'],
                'method' => 'GET',
                'path' => 'admin/inventory/categories',
                'query' => [],
            ],
            [
                'route_name' => 'inventory.locations.index',
                'action' => [WarehouseController::class, 'locationsMaster'],
                'method' => 'GET',
                'path' => 'admin/inventory/locations',
                'query' => ['per_page' => 10],
            ],
            [
                'route_name' => 'inventory.documents.index',
                'action' => [WarehouseController::class, 'documents'],
                'method' => 'GET',
                'path' => 'admin/inventory/documents',
                'query' => ['per_page' => 10],
            ],
            [
                'route_name' => 'inventory.valuation.index',
                'action' => [WarehouseController::class, 'valuation'],
                'method' => 'GET',
                'path' => 'admin/inventory/valuation',
                'query' => [],
            ],
        ];

        $failures = [];

        foreach ($targets as $target) {
            try {
                $request = Request::create('/' . $target['path'], $target['method'], $target['query']);
                $request->attributes->set('request_id', 'cli-link-check-' . str_replace('.', '-', $target['route_name']));
                $request->setUserResolver(fn () => null);

                $controller = app()->make($target['action'][0]);
                app()->call([$controller, $target['action'][1]], ['request' => $request]);

                $this->line("PASS {$target['route_name']} ({$target['path']})");
            } catch (QueryException $exception) {
                $failures[] = [
                    'route_name' => $target['route_name'],
                    'path' => $target['path'],
                    'exception' => get_class($exception),
                    'message' => $exception->getMessage(),
                ];
                $this->error("FAIL {$target['route_name']}: {$exception->getMessage()}");
            } catch (Throwable $exception) {
                $failures[] = [
                    'route_name' => $target['route_name'],
                    'path' => $target['path'],
                    'exception' => get_class($exception),
                    'message' => $exception->getMessage(),
                ];
                $this->error("FAIL {$target['route_name']}: {$exception->getMessage()}");
            }
        }

        if (!empty($failures)) {
            Log::channel('inventory')->error('inventory.links.verify.failed', [
                'event' => 'inventory.links.verify.failed',
                'reason_code' => 'inventory_route_target_error',
                'failures' => $failures,
                'environment' => app()->environment(),
            ]);

            return self::FAILURE;
        }

        Log::channel('inventory')->info('inventory.links.verify.passed', [
            'event' => 'inventory.links.verify.passed',
            'checked_routes' => array_column($targets, 'route_name'),
            'environment' => app()->environment(),
        ]);

        $this->info('Inventory link target verification passed.');

        return self::SUCCESS;
    }
}

