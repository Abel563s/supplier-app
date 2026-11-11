<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SupplierStatusHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SupplierStatusHistory::query()->with(['supplier', 'changer']);

        if ($search = $request->input('search')) {
            $query->whereHas('supplier', function ($q) use ($search) {
                $q->where('legal_name', 'like', "%{$search}%");
            });
        }

        $logs = $query->orderByDesc('created_at')->paginate(20);

        return Inertia::render('admin/audit-log', [
            'logs' => $logs,
            'title' => 'Audit Log',
        ]);
    }
}
