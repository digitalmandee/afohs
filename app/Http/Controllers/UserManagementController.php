<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    /**
     * Display a listing of users (Super Admin Panel - Web Guard)
     */
    public function index(Request $request)
    {
        $query = User::with(['roles', 'employee', 'allowedTenants']);

        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q
                    ->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->paginate(10)->withQueryString();
        $roles = Role::all();
        $tenants = Tenant::select('id', 'name')->get();

        return Inertia::render('App/Admin/Settings/UserManagement', [
            'users' => $users,
            'roles' => $roles,
            'tenants' => $tenants,
            'filters' => $request->only(['search']),
            'showTrashed' => false,
            'can' => [
                'create' => Auth::guard('web')->user()->can('users.create'),
                'edit' => Auth::guard('web')->user()->can('users.edit'),
                'delete' => Auth::guard('web')->user()->can('users.delete'),
            ]
        ]);
    }

    public function trashed(Request $request)
    {
        $query = User::onlyTrashed()->with(['roles', 'employee', 'allowedTenants']);

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q
                    ->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->orderByDesc('deleted_at')->paginate(10)->withQueryString();
        $roles = Role::all();
        $tenants = Tenant::select('id', 'name')->get();

        return Inertia::render('App/Admin/Settings/UserManagement', [
            'users' => $users,
            'roles' => $roles,
            'tenants' => $tenants,
            'filters' => $request->only(['search']),
            'showTrashed' => true,
            'can' => [
                'create' => Auth::guard('web')->user()->can('users.create'),
                'edit' => Auth::guard('web')->user()->can('users.edit'),
                'delete' => Auth::guard('web')->user()->can('users.delete'),
            ]
        ]);
    }

    /**
     * Create user for Super Admin Panel (Web Guard)
     */
    public function createSuperAdminUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,  // Model's 'hashed' cast handles hashing
        ]);

        // Assign role with web guard
        $user->assignRole($request->role);

        return redirect()
            ->route('admin.users.index')
            ->with('success', 'Super Admin user created successfully!');
    }

    /**
     * Create user from Employee (for POS/Tenant system)
     */
    public function createEmployeeUser(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,employee_id',
            'password' => 'required|min:4',
            'role' => 'nullable|exists:roles,name',
        ]);

        $employee = Employee::where('employee_id', $request->employee_id)->firstOrFail();

        // Check if employee already has a user
        if ($employee->user_id) {
            $existingUser = User::withTrashed()->find($employee->user_id);

            if ($existingUser && $existingUser->trashed()) {
                $existingUser->restore();
                $existingUser->update([
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'password' => Hash::make($request->password),
                ]);
                $existingUser->syncRoles([$request->role ?: 'pos']);
                app(PermissionRegistrar::class)->forgetCachedPermissions();

                $tenantIds = Tenant::query()
                    ->where('status', 'active')
                    ->when($employee->branch_id, fn ($q) => $q->where('branch_id', $employee->branch_id))
                    ->pluck('id')
                    ->toArray();
                $existingUser->allowedTenants()->sync($tenantIds);

                return redirect()
                    ->back()
                    ->with('success', 'Employee user account restored successfully!');
            }

            return back()->with('error', 'Employee already has a user account!');
        }

        $user = User::create([
            'name' => $employee->name,
            'email' => $employee->email,
            'password' => Hash::make($request->password),
        ]);

        // Update employee with user_id
        $employee->update(['user_id' => $user->id]);

        $user->assignRole($request->role ?: 'cashier');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $tenantIds = Tenant::query()
            ->where('status', 'active')
            ->when($employee->branch_id, fn ($q) => $q->where('branch_id', $employee->branch_id))
            ->pluck('id')
            ->toArray();

        $user->allowedTenants()->sync($tenantIds);

        return redirect()
            ->back()
            ->with('success', 'Employee user account created successfully!');
    }

    /**
     * Update User (name/email/password)
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8',
        ]);

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        if ($request->filled('password')) {
            $user->update(['password' => $request->password]);
        }

        return redirect()
            ->back()
            ->with('success', 'User updated successfully!');
    }

    /**
     * Update Employee User (Password & Tenant Access)
     */
    public function updateEmployeeUser(Request $request, $id)
    {
        $request->validate([
            'password' => 'nullable|min:4',
        ]);

        $user = User::findOrFail($id);

        // Update password if provided
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        $user->loadMissing('employee');
        $employee = $user->employee;

        $tenantIds = Tenant::query()
            ->where('status', 'active')
            ->when($employee?->branch_id, fn ($q) => $q->where('branch_id', $employee->branch_id))
            ->pluck('id')
            ->toArray();

        $user->allowedTenants()->sync($tenantIds);

        return redirect()
            ->back()
            ->with('success', 'Employee user updated successfully!');
    }

    /**
     * Assign role to user
     */
    public function assignRole(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_name' => 'required|exists:roles,name',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->assignRole($request->role_name);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'message' => 'Role assigned successfully!',
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Remove role from user
     */
    public function removeRole(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'role_name' => 'required|exists:roles,name',
        ]);

        $user = User::findOrFail($request->user_id);
        $user->removeRole($request->role_name);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return response()->json([
            'message' => 'Role removed successfully!',
            'user' => $user->load('roles'),
        ]);
    }

    /**
     * Delete user
     */
    public function destroy(Request $request, $id)
    {
        $user = User::with('employee')->findOrFail($id);

        $currentUserId = Auth::guard('web')->id();
        if ($currentUserId && (int) $user->id === (int) $currentUserId) {
            throw ValidationException::withMessages([
                'delete' => 'You cannot delete your own account.',
            ]);
        }

        DB::transaction(function () use ($user) {
            $user->delete();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->back()
            ->with('success', 'User deleted successfully!');
    }

    public function restore(Request $request, $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        return redirect()
            ->back()
            ->with('success', 'User restored successfully!');
    }

    public function forceDelete(Request $request, $id)
    {
        $user = User::withTrashed()->with('employee')->findOrFail($id);

        $currentUserId = Auth::guard('web')->id();
        if ($currentUserId && (int) $user->id === (int) $currentUserId) {
            throw ValidationException::withMessages([
                'delete' => 'You cannot delete your own account.',
            ]);
        }

        DB::transaction(function () use ($user) {
            if ($user->employee) {
                $user->employee->update(['user_id' => null]);
            }

            $user->allowedTenants()->detach();
            $user->syncRoles([]);
            $user->forceDelete();
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return redirect()
            ->back()
            ->with('success', 'User permanently deleted successfully!');
    }
}
