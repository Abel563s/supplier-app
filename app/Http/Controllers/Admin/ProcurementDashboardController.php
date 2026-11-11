<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProcurementRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProcurementDashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $userRequests = ProcurementRequest::query()
            ->where('user_id', $request->user()->id);

        $requestCounts = (clone $userRequests)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $stats = [
            'total' => (int) $requestCounts->sum(),
            'draft' => (int) ($requestCounts['draft'] ?? 0),
            'submitted' => (int) ($requestCounts['submitted'] ?? 0),
            'under_review' => (int) ($requestCounts['under_review'] ?? 0),
            'approved' => (int) ($requestCounts['approved'] ?? 0),
            'rejected' => (int) ($requestCounts['rejected'] ?? 0),
            'cancelled' => (int) ($requestCounts['cancelled'] ?? 0),
        ];

        $recent = (clone $userRequests)
            ->latest()
            ->limit(6)
            ->get([
                'id',
                'primary_business_category',
                'subcategory',
                'procurement_type',
                'number_of_suppliers_required',
                'status',
                'submitted_at',
                'created_at',
            ]);

        return Inertia::render('admin/procurement/dashboard', [
            'stats' => $stats,
            'recent' => $recent,
            'userName' => $request->user()->name,
            'title' => 'Procurement Dashboard',
        ]);
    }
}
