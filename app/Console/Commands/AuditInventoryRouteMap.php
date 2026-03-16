<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;

class AuditInventoryRouteMap extends Command
{
    protected $signature = 'inventory:audit-route-map';

    protected $description = 'Audit inventory route() usage in admin inventory pages/sidebar against registered inventory.* routes.';

    public function handle(): int
    {
        $paths = [
            resource_path('js/pages/App/Admin/Inventory'),
            resource_path('js/components/App/AdminSideBar/SideNav.jsx'),
        ];

        $usedRouteNames = [];

        foreach ($paths as $path) {
            if (File::isFile($path)) {
                $this->collectFromFile($path, $usedRouteNames);
                continue;
            }

            if (!File::isDirectory($path)) {
                continue;
            }

            foreach (File::allFiles($path) as $file) {
                $this->collectFromFile($file->getPathname(), $usedRouteNames);
            }
        }

        $usedInventoryRoutes = collect(array_keys($usedRouteNames))
            ->filter(fn ($name) => str_starts_with($name, 'inventory.'))
            ->values()
            ->all();

        $registered = array_keys(Route::getRoutes()->getRoutesByName());
        $registeredInventoryRoutes = array_values(array_filter($registered, fn ($name) => is_string($name) && str_starts_with($name, 'inventory.')));

        sort($usedInventoryRoutes);
        sort($registeredInventoryRoutes);

        $missing = array_values(array_diff($usedInventoryRoutes, $registeredInventoryRoutes));
        $unused = array_values(array_diff($registeredInventoryRoutes, $usedInventoryRoutes));

        $this->line('Used inventory routes: ' . count($usedInventoryRoutes));
        $this->line('Registered inventory routes: ' . count($registeredInventoryRoutes));

        if (!empty($missing)) {
            $this->error('Missing registered routes for inventory route() usage:');
            foreach ($missing as $name) {
                $this->line("- {$name}");
            }
        }

        if (!empty($unused)) {
            $this->warn('Registered inventory routes currently unused by inventory pages/sidebar:');
            foreach ($unused as $name) {
                $this->line("- {$name}");
            }
        }

        if (!empty($missing)) {
            Log::channel('inventory')->error('inventory.route_map.audit.failed', [
                'event' => 'inventory.route_map.audit.failed',
                'reason_code' => 'missing_registered_inventory_routes',
                'missing_routes' => $missing,
                'used_routes' => $usedInventoryRoutes,
                'registered_routes' => $registeredInventoryRoutes,
                'environment' => app()->environment(),
            ]);

            return self::FAILURE;
        }

        Log::channel('inventory')->info('inventory.route_map.audit.passed', [
            'event' => 'inventory.route_map.audit.passed',
            'used_routes' => $usedInventoryRoutes,
            'registered_routes' => $registeredInventoryRoutes,
            'unused_registered_routes' => $unused,
            'environment' => app()->environment(),
        ]);

        $this->info('Inventory route map audit passed.');

        return self::SUCCESS;
    }

    protected function collectFromFile(string $filePath, array &$usedRouteNames): void
    {
        $content = File::get($filePath);
        if ($content === '') {
            return;
        }

        preg_match_all("/route\\('([^']+)'/", $content, $matches);
        foreach ($matches[1] as $name) {
            $usedRouteNames[$name] = true;
        }
    }
}

