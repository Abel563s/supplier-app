<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnlyMiddleware
{
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();
        $roleType = $user?->roleDefinition?->type;
        $allowedRoles = $allowedRoles === [] ? [Role::ADMIN] : $allowedRoles;

        if (! $user || (! in_array($user->role, $allowedRoles, true) && ! in_array($roleType, $allowedRoles, true))) {
            abort(403, 'You do not have permission to access this area.');
        }

        return $next($request);
    }
}
