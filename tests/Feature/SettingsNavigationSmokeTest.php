<?php

namespace Tests\Feature;

use App\Http\Controllers\SettingController;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Response as InertiaResponse;
use Inertia\Support\Header;
use Tests\TestCase;

class SettingsNavigationSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_and_printer_routes_exist(): void
    {
        $routes = [
            'setting.index',
            'setting.update',
            'printers.index',
            'printers.discover',
            'printers.update',
            'printers.profiles.store',
            'printers.profiles.update',
            'printers.profiles.destroy',
            'printer.index',
            'printer.test',
            'profile.edit',
            'password.edit',
            'admin.roles.index',
            'admin.users.index',
            'admin.billing-settings.edit',
        ];

        foreach ($routes as $name) {
            $this->assertTrue(Route::has($name), "Route '{$name}' is missing.");
        }
    }

    public function test_admin_settings_routes_exist_with_the_preserved_old_structure(): void
    {
        $routes = [
            'admin.roles.index',
            'admin.users.index',
            'admin.billing-settings.edit',
            'profile.edit',
            'password.edit',
        ];

        foreach ($routes as $name) {
            $this->assertTrue(Route::has($name), "Admin settings route '{$name}' is missing.");
        }
    }

    public function test_admin_sidebar_keeps_the_old_settings_children_and_order(): void
    {
        $sidebar = file_get_contents(resource_path('js/components/App/AdminSideBar/SideNav.jsx'));

        $this->assertIsString($sidebar);

        $expectedSnippets = [
            "text: 'Settings'",
            "text: 'Role Management', path: route('admin.roles.index')",
            "text: 'User Management', path: route('admin.users.index')",
            "text: 'Billing', path: route('admin.billing-settings.edit')",
            "text: 'Profile Settings', path: route('profile.edit')",
            "text: 'Password', path: route('password.edit')",
        ];

        foreach ($expectedSnippets as $snippet) {
            $this->assertStringContainsString($snippet, $sidebar);
        }

        $positions = array_map(
            fn (string $needle) => strpos($sidebar, $needle),
            [
                "text: 'Role Management'",
                "text: 'User Management'",
                "text: 'Billing'",
                "text: 'Profile Settings'",
                "text: 'Password'",
            ]
        );

        $this->assertNotContains(false, $positions);

        $sortedPositions = $positions;
        sort($sortedPositions);

        $this->assertSame($sortedPositions, $positions);
    }

    public function test_admin_sidebar_system_group_supports_expandable_settings_submenu(): void
    {
        $sidebar = file_get_contents(resource_path('js/components/App/AdminSideBar/SideNav.jsx'));

        $this->assertIsString($sidebar);
        $this->assertStringNotContainsString("expanded={false}", $sidebar);
        $this->assertStringContainsString("const expanded = open && expandedModule?.text === item.text && item.children?.length;", $sidebar);
        $this->assertStringContainsString("{expanded ? (", $sidebar);
        $this->assertStringContainsString("panelSections.map((section) => (", $sidebar);
    }

    public function test_setting_controller_renders_existing_dashboard_page(): void
    {
        $response = (new SettingController())->index();

        $this->assertInstanceOf(InertiaResponse::class, $response);

        $request = Request::create('/setting', 'GET');
        $request->headers->set(Header::INERTIA, 'true');
        $payload = $response->toResponse($request)->getData(true);

        $this->assertSame('App/Settings/Dashboard', $payload['component'] ?? null);
    }
}
