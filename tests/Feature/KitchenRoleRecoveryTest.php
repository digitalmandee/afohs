<?php

namespace Tests\Feature;

use App\Http\Controllers\KitchenController;
use App\Http\Controllers\PrinterTestController;
use App\Models\User;
use Database\Seeders\PermissionsSeeder;
use Database\Seeders\RolesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Inertia\Response as InertiaResponse;
use Inertia\Support\Header;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class KitchenRoleRecoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_roles_seeder_creates_kitchen_role_for_web_guard(): void
    {
        $this->seed(PermissionsSeeder::class);
        $this->seed(RolesSeeder::class);

        $this->assertDatabaseHas('roles', [
            'name' => 'kitchen',
            'guard_name' => 'web',
        ]);
    }

    public function test_printer_index_renders_setup_error_when_kitchen_role_is_missing(): void
    {
        $request = Request::create('/settings/printers', 'GET');
        $request->setLaravelSession($this->app['session']->driver());

        $response = app(PrinterTestController::class)->index($request);

        $this->assertInstanceOf(InertiaResponse::class, $response);

        $inertiaRequest = Request::create('/settings/printers', 'GET');
        $inertiaRequest->setLaravelSession($this->app['session']->driver());
        $inertiaRequest->headers->set(Header::INERTIA, 'true');
        $payload = $response->toResponse($inertiaRequest)->getData(true);

        $this->assertSame('App/Settings/PrinterTest', $payload['component'] ?? null);
        $this->assertSame([], $payload['props']['kitchens'] ?? null);
        $this->assertSame('Kitchen role is not configured yet. Please run the roles and permissions seeders.', $payload['props']['setupError'] ?? null);
    }

    public function test_kitchen_store_fails_gracefully_when_kitchen_role_is_missing(): void
    {
        $request = Request::create('/kitchens', 'POST', [
            'name' => 'Hot Kitchen',
            'email' => 'kitchen@example.com',
            'phone' => '03001234567',
            'printer_ip' => '192.168.1.20',
            'printer_port' => '9100',
        ]);

        $request->setLaravelSession($this->app['session']->driver());
        $request->headers->set('referer', '/kitchens/create');

        $response = app(KitchenController::class)->store($request);

        $this->assertSame(302, $response->getStatusCode());
        $this->assertDatabaseMissing('users', [
            'email' => 'kitchen@example.com',
        ]);
    }

    public function test_product_factory_does_not_require_kitchen_role_to_exist(): void
    {
        $product = \App\Models\Product::factory()->create();

        $this->assertNull($product->kitchen_id);
    }
}
