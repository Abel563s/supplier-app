<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function create()
    {
        return Inertia::render('admin/login');
    }

    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();
            $roleType = $user?->roleDefinition?->type;

            if (! in_array($roleType, [Role::ADMIN, Role::PROCUREMENT, Role::DEPARTMENT], true)) {
                Auth::logout();
                $request->session()->invalidate();

                return back()->withErrors([
                    'email' => 'You do not have admin access.',
                ]);
            }

            if ($roleType === Role::PROCUREMENT) {
                return redirect('/proc/dashboard');
            }

            if ($roleType === Role::DEPARTMENT) {
                return redirect('/admin/suppliers');
            }

            return redirect()->intended('/admin/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ]);
    }

    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/login');
    }
}
