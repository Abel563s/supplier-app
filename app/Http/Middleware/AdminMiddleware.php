<?php

namespace App\Http\Middleware;

use App\Models\Role;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $roleType = $request->user()?->roleDefinition?->type;

        if (! in_array($roleType, [Role::ADMIN, Role::PROCUREMENT, Role::DEPARTMENT], true)) {
            abort(403, 'You do not have permission to access this area.');
        }

        return $next($request);
    }
}
