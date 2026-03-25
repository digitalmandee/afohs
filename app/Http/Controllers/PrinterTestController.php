<?php

namespace App\Http\Controllers;

use App\Models\KitchenDetail;
use App\Models\PrinterProfile;
use App\Models\PrinterScanRange;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Printing\PrinterConnectorFactory;
use App\Services\Printing\KitchenPrinterResolver;
use App\Services\Printing\PrinterDiscoveryService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Mike42\Escpos\Printer;
use App\Support\KitchenRoleSupport;

class PrinterTestController extends Controller
{
    public function __construct(
        protected KitchenPrinterResolver $printerResolver,
        protected PrinterDiscoveryService $printerDiscoveryService,
        protected PrinterConnectorFactory $printerConnectorFactory,
    ) {
    }

    public function index(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $restaurant = $restaurantId
            ? Tenant::query()->select('id', 'name', 'printer_ip', 'printer_port', 'printer_profile_id')->find($restaurantId)
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
            ->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port,printer_profile_id')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => (int) $user->id,
                    'name' => $user->name,
                    'printer_ip' => $user->kitchenDetail?->printer_ip,
                    'printer_port' => (int) ($user->kitchenDetail?->printer_port ?: 9100),
                    'printer_profile_id' => $user->kitchenDetail?->printer_profile_id ? (int) $user->kitchenDetail->printer_profile_id : null,
                ];
            })
            ->values();

        return Inertia::render('App/Settings/PrinterTest', [
            'restaurant' => $restaurant ? [
                'id' => (int) $restaurant->id,
                'name' => $restaurant->name,
                'printer_ip' => $restaurant->printer_ip,
                'printer_port' => (int) ($restaurant->printer_port ?: 9100),
                'printer_profile_id' => $restaurant->printer_profile_id ? (int) $restaurant->printer_profile_id : null,
            ] : null,
            'kitchens' => $kitchens,
            'profiles' => $this->profilesPayload($restaurantId),
            'scanRanges' => $this->scanRangesPayload($restaurantId),
            'setupError' => $setupError,
        ]);
    }

    public function discover(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $discovery = $this->printerDiscoveryService->discoverBundle($restaurantId);
        $printers = $discovery['printers'];

        Log::channel('printing')->info('pos.printers.discover.completed', [
            'event' => 'pos.printers.discover.completed',
            'request_id' => $request->attributes->get('request_id'),
            'user_id' => $request->user()?->id,
            'restaurant_id' => $restaurantId,
            'discovered_count' => count($printers),
            'network_count' => count(array_filter($printers, fn (array $printer) => $printer['source'] === 'network_scan')),
        ]);

        return response()->json([
            'success' => true,
            'printers' => $printers,
            'sources' => $discovery['sources'],
            'scan_ranges' => $discovery['scan_ranges'] ?? [],
            'summary' => $discovery['summary'] ?? null,
        ]);
    }

    public function updateMappings(Request $request)
    {
        $validated = $request->validate([
            'receipt_printer.printer_profile_id' => 'nullable|integer|exists:printer_profiles,id',
            'kitchens' => 'nullable|array',
            'kitchens.*.kitchen_id' => 'required|exists:users,id',
            'kitchens.*.printer_profile_id' => 'nullable|integer|exists:printer_profiles,id',
        ]);

        $restaurantId = $this->resolveRestaurantId($request);
        if ($restaurantId) {
            $tenant = Tenant::query()->find($restaurantId);
            if ($tenant) {
                $tenant->update(
                    $this->assignmentPayload(
                        $this->profileForRestaurant($validated['receipt_printer']['printer_profile_id'] ?? null, $restaurantId)
                    )
                );
            }
        }

        foreach (($validated['kitchens'] ?? []) as $kitchen) {
            KitchenDetail::query()->updateOrCreate(
                ['kitchen_id' => (int) $kitchen['kitchen_id']],
                $this->assignmentPayload(
                    $this->profileForRestaurant($kitchen['printer_profile_id'] ?? null, $restaurantId)
                )
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

    public function storeProfile(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'printer_ip' => 'required|ip',
            'printer_port' => 'nullable|integer|min:1|max:65535',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $profile = PrinterProfile::query()->create([
            'tenant_id' => $restaurantId,
            'name' => trim($validated['name']),
            'printer_ip' => $validated['printer_ip'],
            'printer_port' => (int) ($validated['printer_port'] ?? 9100),
            'notes' => $validated['notes'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'profile' => $this->profilePayload($profile),
        ]);
    }

    public function updateProfile(Request $request, PrinterProfile $printerProfile)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        abort_unless($this->profileVisibleToRestaurant($printerProfile, $restaurantId), 404);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'printer_ip' => 'required|ip',
            'printer_port' => 'nullable|integer|min:1|max:65535',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $printerProfile->update([
            'name' => trim($validated['name']),
            'printer_ip' => $validated['printer_ip'],
            'printer_port' => (int) ($validated['printer_port'] ?? 9100),
            'notes' => $validated['notes'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'profile' => $this->profilePayload($printerProfile->fresh()),
        ]);
    }

    public function destroyProfile(Request $request, PrinterProfile $printerProfile)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        abort_unless($this->profileVisibleToRestaurant($printerProfile, $restaurantId), 404);

        $isInUse = Tenant::query()->where('printer_profile_id', $printerProfile->id)->exists()
            || KitchenDetail::query()->where('printer_profile_id', $printerProfile->id)->exists();

        if ($isInUse) {
            return response()->json([
                'success' => false,
                'message' => 'This printer profile is still assigned. Reassign or clear it before deleting.',
            ], 422);
        }

        $printerProfile->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    public function storeScanRange(Request $request)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'range_value' => 'required|string|max:255',
            'range_type' => 'required|in:cidr,range',
            'port' => 'nullable|integer|min:1|max:65535',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $scanRange = PrinterScanRange::query()->create([
            'tenant_id' => $restaurantId,
            'label' => trim($validated['label']),
            'range_value' => trim($validated['range_value']),
            'range_type' => $validated['range_type'],
            'port' => (int) ($validated['port'] ?? 9100),
            'notes' => $validated['notes'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'scan_range' => $this->scanRangePayload($scanRange),
        ]);
    }

    public function updateScanRange(Request $request, PrinterScanRange $printerScanRange)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        abort_unless($this->scanRangeVisibleToRestaurant($printerScanRange, $restaurantId), 404);

        $validated = $request->validate([
            'label' => 'required|string|max:255',
            'range_value' => 'required|string|max:255',
            'range_type' => 'required|in:cidr,range',
            'port' => 'nullable|integer|min:1|max:65535',
            'notes' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        $printerScanRange->update([
            'label' => trim($validated['label']),
            'range_value' => trim($validated['range_value']),
            'range_type' => $validated['range_type'],
            'port' => (int) ($validated['port'] ?? 9100),
            'notes' => $validated['notes'] ?? null,
            'is_active' => (bool) ($validated['is_active'] ?? true),
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'success' => true,
            'scan_range' => $this->scanRangePayload($printerScanRange->fresh()),
        ]);
    }

    public function destroyScanRange(Request $request, PrinterScanRange $printerScanRange)
    {
        $restaurantId = $this->resolveRestaurantId($request);
        abort_unless($this->scanRangeVisibleToRestaurant($printerScanRange, $restaurantId), 404);

        $printerScanRange->delete();

        return response()->json([
            'success' => true,
        ]);
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
            target: $target,
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
            target: $target,
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

        return $this->sendPrinterTest(
            target: [
                'printer_source' => 'network_scan',
                'printer_profile_id' => null,
                'printer_ip' => (string) $request->printer_ip,
                'printer_port' => (int) ($request->printer_port ?? 9100),
                'printer_name' => null,
                'printer_connector' => null,
                'printer_label' => (string) $request->printer_ip,
            ],
            meta: [
                'target_type' => 'manual',
                'target_id' => null,
                'target_name' => 'Manual test',
            ],
            request: $request
        );
    }

    protected function sendPrinterTest(array $target, array $meta, Request $request)
    {
        $source = (string) ($target['printer_source'] ?? 'network_scan');
        $printerProfileId = $target['printer_profile_id'] ?? null;
        $printerName = $target['printer_name'] ?? null;
        $printerConnector = $target['printer_connector'] ?? null;
        $ip = $target['printer_ip'] ?? null;
        $port = $target['printer_port'] ?? null;

        try {
            $connector = $this->printerConnectorFactory->create($target);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setTextSize(2, 2);
            $printer->text("PRINTER TEST\n");
            $printer->setTextSize(1, 1);
            $printer->text("================================\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Target: " . ($meta['target_name'] ?? 'Unknown') . "\n");
            if (!empty($target['printer_label'])) {
                $printer->text('Profile: ' . $target['printer_label'] . "\n");
            }
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
                'printer_profile_id' => $printerProfileId,
                'printer_source' => $source,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
                'status' => 'sent',
            ]);

            return response()->json([
                'success' => true,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_profile_id' => $printerProfileId,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_source' => $source,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
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
                'printer_profile_id' => $printerProfileId,
                'printer_source' => $source,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'target_type' => $meta['target_type'] ?? null,
                'target_id' => $meta['target_id'] ?? null,
                'printer_profile_id' => $printerProfileId,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_source' => $source,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
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

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function profilesPayload(?int $restaurantId): array
    {
        return PrinterProfile::query()
            ->forRestaurant($restaurantId)
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->map(fn (PrinterProfile $profile) => $this->profilePayload($profile))
            ->values()
            ->all();
    }

    protected function profilePayload(PrinterProfile $profile): array
    {
        return [
            'id' => (int) $profile->id,
            'name' => $profile->name,
            'printer_ip' => $profile->printer_ip,
            'printer_port' => (int) ($profile->printer_port ?: 9100),
            'is_active' => (bool) $profile->is_active,
            'notes' => $profile->notes,
            'tenant_id' => $profile->tenant_id ? (int) $profile->tenant_id : null,
        ];
    }

    protected function profileForRestaurant(?int $profileId, ?int $restaurantId): ?PrinterProfile
    {
        if (!$profileId) {
            return null;
        }

        return PrinterProfile::query()
            ->forRestaurant($restaurantId)
            ->find($profileId);
    }

    protected function profileVisibleToRestaurant(PrinterProfile $profile, ?int $restaurantId): bool
    {
        return $profile->tenant_id === null || (int) $profile->tenant_id === (int) $restaurantId;
    }

    protected function assignmentPayload(?PrinterProfile $profile): array
    {
        return [
            'printer_profile_id' => $profile?->id,
            'printer_ip' => $profile?->printer_ip,
            'printer_port' => $profile ? (int) ($profile->printer_port ?: 9100) : null,
            'printer_source' => $profile ? 'network_scan' : null,
            'printer_name' => null,
            'printer_connector' => null,
        ];
    }

    protected function scanRangesPayload(?int $restaurantId): array
    {
        return PrinterScanRange::query()
            ->forRestaurant($restaurantId)
            ->orderByDesc('is_active')
            ->orderBy('label')
            ->get()
            ->map(fn (PrinterScanRange $range) => $this->scanRangePayload($range))
            ->values()
            ->all();
    }

    protected function scanRangePayload(PrinterScanRange $range): array
    {
        return [
            'id' => (int) $range->id,
            'label' => $range->label,
            'range_value' => $range->range_value,
            'range_type' => $range->range_type,
            'port' => (int) ($range->port ?: 9100),
            'is_active' => (bool) $range->is_active,
            'notes' => $range->notes,
            'tenant_id' => $range->tenant_id ? (int) $range->tenant_id : null,
        ];
    }

    protected function scanRangeVisibleToRestaurant(PrinterScanRange $scanRange, ?int $restaurantId): bool
    {
        return $scanRange->tenant_id === null || (int) $scanRange->tenant_id === (int) $restaurantId;
    }
}
