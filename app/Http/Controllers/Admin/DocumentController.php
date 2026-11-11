<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentController extends Controller
{
    public function index(Request $request, Supplier $supplier)
    {
        $this->authorizeSupplierAccess($request, $supplier);

        return Inertia::render('admin/suppliers/documents', [
            'supplier' => $supplier,
            'documents' => $supplier->documents()->orderBy('document_type')->get(),
            'isAdmin' => $request->user()->isAdmin(),
            'title' => 'Documents',
        ]);
    }

    public function view(Request $request, Supplier $supplier, SupplierDocument $document)
    {
        $this->authorizeSupplierAccess($request, $supplier);
        abort_if($document->supplier_id !== $supplier->id, 404);

        $path = Storage::disk('public')->path($document->file_path);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function update(Request $request, Supplier $supplier, $document)
    {
        abort_unless($request->user()->isAdmin(), 403);

        $document = SupplierDocument::where('supplier_id', $supplier->id)->findOrFail($document);

        $validated = $request->validate([
            'review_status' => ['required', 'in:pending,verified,rejected,replacement_required,not_applicable'],
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $document->update([
            ...$validated,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        return back()->with('success', 'Document updated successfully.');
    }

    public function destroy(Request $request, Supplier $supplier, SupplierDocument $document)
    {
        abort_unless($request->user()->isAdmin(), 403);
        abort_if($document->supplier_id !== $supplier->id, 404);

        if (Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return back()->with('success', 'Document deleted successfully.');
    }

    private function authorizeSupplierAccess(Request $request, Supplier $supplier): void
    {
        if ($request->user()->roleDefinition?->type === Role::DEPARTMENT) {
            abort_unless(
                $supplier->departmentReviews()->where('department', $request->user()->role)->exists(),
                404,
            );
        }
    }
}
