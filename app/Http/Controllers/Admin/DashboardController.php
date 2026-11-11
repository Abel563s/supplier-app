<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $stats = [
            'total' => Supplier::count(),
            'draft' => Supplier::where('status', 'draft')->count(),
            'submitted' => Supplier::where('status', 'submitted')->count(),
            'under_review' => Supplier::whereIn('status', ['pending', 'under_review'])->count(),
            'needs_correction' => Supplier::where('status', 'needs_correction')->count(),
            'approved' => Supplier::where('status', 'approved')->count(),
            'rejected' => Supplier::where('status', 'rejected')->count(),
            'documents_pending' => SupplierDocument::where('review_status', 'pending')->count(),
        ];

        $recent = Supplier::orderByDesc('created_at')->limit(10)->get();

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
            'recent' => $recent,
            'title' => 'Dashboard',
        ]);
    }
}
