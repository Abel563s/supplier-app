<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class RolesController extends Controller
{
    public function index(Request $request)
    {
        $admins = User::whereHas('roleDefinition', fn ($query) => $query->where('type', '!=', Role::SUPPLIER))
            ->orderByDesc('created_at')
            ->paginate(20);

        $suppliers = Supplier::orderByDesc('created_at')->paginate(20);
        $roles = Role::query()->where('type', '!=', Role::SUPPLIER)->orderBy('name')->get(['key', 'name', 'type']);

        return Inertia::render('admin/roles/index', [
            'admins' => $admins,
            'suppliers' => $suppliers,
            'roles' => $roles,
            'title' => 'Roles',
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', 'in:'.implode(',', $this->staffRoleKeys())],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Role created successfully.');
    }

    public function storePublic(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', 'string', 'in:'.implode(',', $this->publicRoleKeys())],
            'status' => ['required', 'in:active,inactive'],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        User::create($validated);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'role' => ['required', 'string', 'in:'.implode(',', $this->staffRoleKeys())],
            'status' => ['nullable', 'in:active,inactive'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (empty($validated['status'])) {
            unset($validated['status']);
        }

        if (! empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            abort(403);
        }

        if ($user->role === 'supplier') {
            abort(404);
        }

        $user->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    /**
     * @return list<string>
     */
    private function staffRoleKeys(): array
    {
        return Role::query()->where('type', '!=', Role::SUPPLIER)->pluck('key')->all();
    }

    /**
     * @return list<string>
     */
    private function publicRoleKeys(): array
    {
        return Role::query()->whereIn('type', [Role::ADMIN, Role::PROCUREMENT])->pluck('key')->all();
    }
}
