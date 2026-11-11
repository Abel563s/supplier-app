<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestMatch;
use App\Models\ProcurementRequestSupplier;
use App\Services\SupplierMatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProcurementRequestController extends Controller
{
    public function __construct(
        protected SupplierMatchingService $matchingService
    ) {}

    public function index(Request $request)
    {
        $status = $request->query('status');

        $query = ProcurementRequest::query()->with(['user', 'category']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $requests = $query->orderByDesc('created_at')->paginate(20)->withQueryString();

        return Inertia::render('admin/procurement/supplier-requests/index', [
            'requests' => $requests,
            'filters' => [
                'status' => $status,
            ],
            'title' => 'Supplier Requests',
        ]);
    }

    public function show(ProcurementRequest $supplierRequest)
    {
        $supplierRequest->load(['user', 'category', 'subcategory']);

        $matches = $this->matchingService->getRankedMatches($supplierRequest);
        $summary = $this->matchingService->getMatchSummary($supplierRequest);

        $selectedSuppliers = ProcurementRequestSupplier::query()
            ->where('procurement_request_id', $supplierRequest->id)
            ->where('selected', true)
            ->with(['supplier' => fn ($query) => $query->withCount('contracts')])
            ->get();

        $approvedSuppliers = $selectedSuppliers
            ->where('approved', true)
            ->map(fn ($selection) => [
                'id' => $selection->supplier->id,
                'legal_name' => $selection->supplier->legal_name,
                'trade_name' => $selection->supplier->trade_name,
                'primary_business_category' => $selection->supplier->primary_business_category,
                'sub_category' => $selection->supplier->sub_category,
                'registered_capital' => $selection->supplier->registered_capital,
                'latest_annual_turnover' => $selection->supplier->latest_annual_turnover,
                'contracts_count' => $selection->supplier->contracts_count,
                'selection_reason' => $selection->selection_reason,
                'override_reason' => $selection->override_reason,
            ])
            ->values()
            ->all();

        $savedOverrideReasons = $selectedSuppliers
            ->filter(fn ($selection) => filled($selection->override_reason))
            ->mapWithKeys(fn ($selection) => [$selection->supplier_id => $selection->override_reason])
            ->all();

        $success = session('success');

        return Inertia::render('admin/procurement/supplier-requests/show', [
            'request' => $supplierRequest,
            'matchedSuppliers' => $matches,
            'matchSummary' => $summary,
            'selectedSuppliers' => $selectedSuppliers->map(fn ($s) => $s->supplier_id)->toArray(),
            'savedOverrideReasons' => $savedOverrideReasons,
            'approvedSuppliers' => $approvedSuppliers,
            'success' => $success ?: null,
            'title' => 'Supplier Request Details',
        ]);
    }

    public function runMatching(ProcurementRequest $supplierRequest)
    {
        $this->matchingService->runMatching($supplierRequest);
        $this->matchingService->getMatchSummary($supplierRequest);

        return redirect()->route('supplier-requests.show', $supplierRequest)->with('success', 'Supplier matching completed.');
    }

    public function selectSuppliers(Request $request, ProcurementRequest $supplierRequest)
    {
        if ($supplierRequest->status === 'approved') {
            return back()->withErrors([
                'supplier_ids' => 'Approved requests cannot have their supplier selection changed.',
            ]);
        }

        $validated = $request->validate([
            'supplier_ids' => ['present', 'array'],
            'supplier_ids.*' => ['integer', 'distinct', 'exists:suppliers,id'],
            'selection_reason' => ['nullable', 'string', 'max:2000'],
            'override_reasons' => ['nullable', 'array'],
            'override_reasons.*' => ['nullable', 'string', 'max:2000'],
        ]);

        $supplierIds = $validated['supplier_ids'];
        $selectionReason = $validated['selection_reason'] ?? '';
        $overrideReasons = $validated['override_reasons'] ?? [];

        $supplierMatches = ProcurementRequestMatch::query()
            ->where('procurement_request_id', $supplierRequest->id)
            ->whereIn('supplier_id', $supplierIds)
            ->get(['supplier_id', 'eligible']);

        if ($supplierMatches->count() !== count($supplierIds)) {
            return back()->withErrors([
                'supplier_ids' => 'Select only suppliers matched to this request.',
            ]);
        }

        foreach ($supplierMatches->where('eligible', false) as $supplierMatch) {
            $supplierId = $supplierMatch->supplier_id;

            if (! filled($overrideReasons[$supplierId] ?? null)) {
                return back()->withErrors([
                    "override_reasons.{$supplierId}" => 'A reason is required to override an ineligible supplier.',
                ]);
            }
        }

        $requiredCount = $supplierRequest->number_of_suppliers_required;

        if (count($supplierIds) > $requiredCount) {
            return back()->withErrors([
                'supplier_ids' => "Cannot select more than {$requiredCount} suppliers.",
            ]);
        }

        DB::transaction(function () use ($request, $selectionReason, $overrideReasons, $supplierIds, $supplierRequest): void {
            ProcurementRequestSupplier::where('procurement_request_id', $supplierRequest->id)
                ->where('selected', true)
                ->update(['selected' => false]);

            foreach ($supplierIds as $supplierId) {
                $overrideReason = $overrideReasons[$supplierId] ?? null;
                $isOverride = $overrideReason !== null && $overrideReason !== '';

                ProcurementRequestSupplier::updateOrCreate(
                    [
                        'procurement_request_id' => $supplierRequest->id,
                        'supplier_id' => $supplierId,
                    ],
                    [
                        'selected' => true,
                        'selection_reason' => $selectionReason,
                        'override_reason' => $isOverride ? $overrideReason : null,
                        'selected_by' => $request->user()->id,
                        'selected_at' => now(),
                    ]
                );
            }

            $supplierRequest->update(['status' => 'under_review']);
        });

        return back()->with('success', 'Suppliers selected successfully.');
    }

    public function approveShortlist(Request $request, ProcurementRequest $supplierRequest)
    {
        $selectedCount = ProcurementRequestSupplier::where('procurement_request_id', $supplierRequest->id)
            ->where('selected', true)
            ->count();

        $requiredCount = $supplierRequest->number_of_suppliers_required;

        if ($selectedCount < $requiredCount) {
            return back()->withErrors([
                'shortlist' => "Please select {$requiredCount} suppliers before approving the shortlist. Currently {$selectedCount} selected.",
            ]);
        }

        ProcurementRequestSupplier::where('procurement_request_id', $supplierRequest->id)
            ->where('selected', true)
            ->update([
                'approved' => true,
                'approved_at' => now(),
            ]);

        $supplierRequest->update(['status' => 'approved']);

        return back()->with('success', 'Supplier shortlist approved successfully.');
    }

    public function unselectSupplier(Request $request, ProcurementRequest $supplierRequest, $supplierId)
    {
        ProcurementRequestSupplier::where('procurement_request_id', $supplierRequest->id)
            ->where('supplier_id', $supplierId)
            ->update(['selected' => false]);

        return back()->with('success', 'Supplier removed from selection.');
    }

    public function approve(Request $request, ProcurementRequest $supplierRequest)
    {
        DB::transaction(function () use ($supplierRequest): void {
            ProcurementRequestSupplier::query()
                ->where('procurement_request_id', $supplierRequest->id)
                ->where('selected', true)
                ->update([
                    'approved' => true,
                    'approved_at' => now(),
                ]);

            $supplierRequest->update(['status' => 'approved']);
        });

        return back()->with('success', 'Supplier request approved successfully.');
    }

    public function reject(Request $request, ProcurementRequest $supplierRequest)
    {
        $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $supplierRequest->update([
            'status' => 'rejected',
        ]);

        return back()->with('success', 'Supplier request rejected.');
    }

    public function viewRoDocument(Request $request, ProcurementRequest $supplierRequest)
    {
        abort_if(empty($supplierRequest->ro_document), 404);

        $path = Storage::disk('public')->path($supplierRequest->ro_document);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function viewTechSpecDocument(Request $request, ProcurementRequest $supplierRequest)
    {
        abort_if(empty($supplierRequest->tech_spec_document), 404);

        $path = Storage::disk('public')->path($supplierRequest->tech_spec_document);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function destroy(Request $request, ProcurementRequest $supplierRequest)
    {
        $supplierRequest->delete();

        return back()->with('success', 'Supplier request deleted successfully.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function approvedSuppliers(ProcurementRequest $procurementRequest): array
    {
        return ProcurementRequestSupplier::query()
            ->where('procurement_request_id', $procurementRequest->id)
            ->where('selected', true)
            ->where('approved', true)
            ->with('supplier')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->supplier->id,
                'legal_name' => $item->supplier->legal_name,
                'trade_name' => $item->supplier->trade_name,
                'primary_business_category' => $item->supplier->primary_business_category,
                'sub_category' => $item->supplier->sub_category,
                'procurement_type' => $item->supplier->procurement_type,
                'registered_capital' => $item->supplier->registered_capital,
                'latest_annual_turnover' => $item->supplier->latest_annual_turnover,
                'contracts_count' => $item->supplier->contracts()->count(),
                'city' => $item->supplier->city,
                'subcity' => $item->supplier->subcity,
                'woreda' => $item->supplier->woreda,
                'country_of_registration' => $item->supplier->country_of_registration,
                'primary_contact_name' => $item->supplier->primary_contact_name,
                'primary_phone' => $item->supplier->primary_phone,
                'alternate_phone' => $item->supplier->alternate_phone,
                'primary_email' => $item->supplier->primary_email,
                'date_established' => $item->supplier->date_established,
                'business_registration_no' => $item->supplier->business_registration_no,
                'tin' => $item->supplier->tin,
            ])
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function letterPayload(ProcurementRequest $procurementRequest): array
    {
        return [
            'request' => [
                'number' => 'PR-'.str_pad($procurementRequest->id, 6, '0', STR_PAD_LEFT),
                'procurement_type' => $procurementRequest->procurement_type,
                'primary_business_category' => $procurementRequest->primary_business_category,
                'subcategory' => $procurementRequest->subcategory,
                'purpose_notes' => $procurementRequest->purpose_notes,
                'submitted_at' => $procurementRequest->submitted_at?->toDateTimeString(),
            ],
            'suppliers' => $this->approvedSuppliers($procurementRequest),
        ];
    }

    public function letter(Request $request, $procurementRequest)
    {
        $procurementRequest = ProcurementRequest::with('user')->findOrFail($procurementRequest);

        return Inertia::render('proc/requests/letter', $this->letterPayload($procurementRequest));
    }

    public function printLetter(Request $request, $procurementRequest)
    {
        $procurementRequest = ProcurementRequest::with('user')->findOrFail($procurementRequest);

        return view('proc.requests.letter-print', $this->letterPayload($procurementRequest));
    }
}
