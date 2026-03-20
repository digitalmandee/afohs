<?php

namespace App\Http\Controllers;

use App\Models\KitchenDetail;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Printing\KitchenPrinterResolver;
use App\Services\Printing\PrinterDiscoveryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;
use App\Support\KitchenRoleSupport;

class PrinterTestController extends Controller
{
    public function __construct(
        protected KitchenPrinterResolver $printerResolver,
        protected PrinterDiscoveryService $printerDiscoveryService
    ) {
    }

    public function index(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $restaurant = $restaurantId
            ? Tenant::query()->select('id', 'name', 'printer_ip', 'printer_port')->find($restaurantId)
            : null;

        $setupError = null;
        if (!KitchenRoleSupport::exists()) {
            KitchenRoleSupport::logMissing('pos.printers.index', [
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'restaurant_id' => $restaurantId,
            ]);
            $setupError = KitchenRoleSupport::message();
        }

        $kitchens = KitchenRoleSupport::usersQuery()
            ->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => (int) $user->id,
                    'name' => $user->name,
                    'printer_ip' => $user->kitchenDetail?->printer_ip,
                    'printer_port' => (int) ($user->kitchenDetail?->printer_port ?: 9100),
                ];
            })
            ->values();

        return Inertia::render('App/Settings/PrinterTest', [
            'restaurant' => $restaurant ? [
                'id' => (int) $restaurant->id,
                'name' => $restaurant->name,
                'printer_ip' => $restaurant->printer_ip,
                'printer_port' => (int) ($restaurant->printer_port ?: 9100),
            ] : null,
            'kitchens' => $kitchens,
            'setupError' => $setupError,
        ]);
    }

    public function discover(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $printers = $this->printerDiscoveryService->discover($restaurantId);

        Log::channel('printing')->info('pos.printers.discover.completed', [
            'event' => 'pos.printers.discover.completed',
            'request_id' => $request->attributes->get('request_id'),
            'user_id' => $request->user()?->id,
            'restaurant_id' => $restaurantId,
            'discovered_count' => count($printers),
        ]);

        return response()->json([
            'success' => true,
            'printers' => $printers,
        ]);
    }

    public function updateMappings(Request $request)
    {
        $validated = $request->validate([
            'receipt_printer.printer_ip' => 'nullable|ip',
            'receipt_printer.printer_port' => 'nullable|integer|min:1|max:65535',
            'kitchens' => 'nullable|array',
            'kitchens.*.kitchen_id' => 'required|exists:users,id',
            'kitchens.*.printer_ip' => 'nullable|ip',
            'kitchens.*.printer_port' => 'nullable|integer|min:1|max:65535',
        ]);

        $restaurantId = $this->resolveRestaurantId($request);
        if ($restaurantId) {
            $tenant = Tenant::query()->find($restaurantId);
            if ($tenant) {
                $tenant->update([
                    'printer_ip' => $validated['receipt_printer']['printer_ip'] ?? null,
                    'printer_port' => (int) ($validated['receipt_printer']['printer_port'] ?? 9100),
                ]);
            }
        }

        foreach (($validated['kitchens'] ?? []) as $kitchen) {
            KitchenDetail::query()->updateOrCreate(
                ['kitchen_id' => (int) $kitchen['kitchen_id']],
                [
                    'printer_ip' => $kitchen['printer_ip'] ?? null,
                    'printer_port' => (int) ($kitchen['printer_port'] ?? 9100),
                ]
            );
        }

        Log::channel('printing')->info('pos.printers.mappings.updated', [
            'event' => 'pos.printers.mappings.updated',
            'request_id' => $request->attributes->get('request_id'),
            'user_id' => $request->user()?->id,
            'restaurant_id' => $restaurantId,
            'kitchen_updates_count' => count($validated['kitchens'] ?? []),
        ]);

        return redirect()->back()->with('success', 'Printer mappings updated successfully.');
    }

    public function testKitchenPrinter(Request $request)
    {
        $validated = $request->validate([
            'kitchen_id' => 'required|exists:users,id',
        ]);

        $kitchenId = (int) $validated['kitchen_id'];
        $target = $this->printerResolver->resolveKitchenPrinter($kitchenId);

        if (!$target) {
            return response()->json([
                'success' => false,
                'target_type' => 'kitchen',
                'target_id' => $kitchenId,
                'status' => 'failed',
                'error' => 'missing_printer_config',
                'message' => 'Kitchen printer is not configured.',
            ], 422);
        }

        return $this->sendPrinterTest(
            ip: (string) $target['printer_ip'],
            port: (int) $target['printer_port'],
            meta: [
                'target_type' => 'kitchen',
                'target_id' => (int) $target['target_id'],
                'target_name' => $target['target_name'] ?? null,
            ],
            request: $request
        );
    }

    public function testReceiptPrinter(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $target = $this->printerResolver->resolveRestaurantPrinter($restaurantId);

        if (!$target) {
            return response()->json([
                'success' => false,
                'target_type' => 'restaurant',
                'target_id' => $restaurantId,
                'status' => 'failed',
                'error' => 'missing_printer_config',
                'message' => 'Restaurant receipt printer is not configured.',
            ], 422);
        }

        return $this->sendPrinterTest(
            ip: (string) $target['printer_ip'],
            port: (int) $target['printer_port'],
            meta: [
                'target_type' => 'restaurant',
                'target_id' => (int) $target['target_id'],
                'target_name' => $target['target_name'] ?? null,
            ],
            request: $request
        );
    }

    public function testPrint(Request $request)
    {
        $request->validate([
            'printer_ip' => 'required|ip',
            'printer_port' => 'nullable|integer|min:1|max:65535',
        ]);

        $ip = $request->printer_ip;
        $port = $request->printer_port ?? 9100;

        return $this->sendPrinterTest(
            ip: $ip,
            port: (int) $port,
            meta: [
                'target_type' => 'manual',
                'target_id' => null,
                'target_name' => 'Manual test',
            ],
            request: $request
        );
    }

    protected function sendPrinterTest(string $ip, int $port, array $meta, Request $request)
    {
        try {
            $connector = new NetworkPrintConnector($ip, $port, 5);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setTextSize(2, 2);
            $printer->text("PRINTER TEST\n");
            $printer->setTextSize(1, 1);
            $printer->text("================================\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Target: " . ($meta['target_name'] ?? 'Unknown') . "\n");
            $printer->text("IP: {$ip}\n");
            $printer->text("Port: {$port}\n");
            $printer->text('Date: ' . now()->format('Y-m-d H:i:s') . "\n");
            $printer->text("================================\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Connection Successful!\n");
            $printer->text("AFOHS Club POS System\n");
            $printer->feed(3);
            $printer->cut();
            $printer->close();

            Log::channel('printing')->info('pos.printer.test.sent', [
                'event' => 'pos.printer.test.sent',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'status' => 'sent',
            ]);

            return response()->json([
                'success' => true,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'status' => 'sent',
                'error' => null,
                'message' => 'Test print sent successfully! Check the printer.',
            ]);
        } catch (\Throwable $e) {
            Log::channel('printing')->error('pos.printer.test.failed', [
                'event' => 'pos.printer.test.failed',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'status' => 'failed',
                'error' => $e->getMessage(),
                'message' => 'Failed to connect: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function resolveRestaurantId(Request $request): ?int
    {
        $activeRestaurant = $request->session()->get('active_restaurant_id');
        if ($activeRestaurant) {
            return (int) $activeRestaurant;
        }

        $routeTenant = $request->route('tenant');
        if (is_numeric($routeTenant)) {
            return (int) $routeTenant;
        }

        $tenantHelper = tenant('id');
        if (is_numeric($tenantHelper)) {
            return (int) $tenantHelper;
        }

        $user = Auth::guard('tenant')->user() ?? Auth::user();
        if (!$user || !method_exists($user, 'getAccessibleTenants')) {
            return null;
        }

        $firstTenant = $user->getAccessibleTenants()->first();
        return $firstTenant ? (int) $firstTenant->id : null;
    }
}
