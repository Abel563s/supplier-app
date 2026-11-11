<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Http\Requests\Procurement\StoreProcurementRequestRequest;
use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestMatch;
use App\Models\ProcurementRequestSupplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProcurementRequestController extends Controller
{
    public function create(Request $request)
    {
        $requestsQuery = ProcurementRequest::query();

        if ($request->user()->role !== 'admin') {
            $requestsQuery->where('user_id', $request->user()->id);
        }

        $userRequests = $requestsQuery
            ->orderByDesc('submitted_at')
            ->orderByDesc('id')
            ->get(['id', 'primary_business_category', 'subcategory', 'procurement_type', 'procurement_method', 'ro_number', 'specialization', 'number_of_suppliers_required', 'status', 'submitted_at', 'created_at']);

        return Inertia::render('admin/procurement/request-supplier', [
            'title' => 'Request Supplier',
            'requests' => $userRequests,
        ]);
    }

    public function show(Request $request, $procurementRequest)
    {
        $query = ProcurementRequest::with('user');

        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }

        $procurementRequest = $query->findOrFail($procurementRequest);

        $approvedSuppliers = null;
        $matchingResults = null;

        if ($procurementRequest->status === 'approved') {
            $approvedSuppliers = ProcurementRequestSupplier::where('procurement_request_id', $procurementRequest->id)
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
                    'selected_at' => $item->selected_at?->toDateTimeString(),
                    'approved_at' => $item->approved_at?->toDateTimeString(),
                    'selection_reason' => $item->selection_reason,
                ]);

            $matchingResults = ProcurementRequestMatch::where('procurement_request_id', $procurementRequest->id)
                ->with('supplier')
                ->orderByDesc('eligible')
                ->orderByDesc('match_score')
                ->get()
                ->map(fn ($match) => [
                    'id' => $match->supplier->id,
                    'legal_name' => $match->supplier->legal_name,
                    'trade_name' => $match->supplier->trade_name,
                    'primary_business_category' => $match->supplier->primary_business_category,
                    'procurement_type' => $match->supplier->procurement_type,
                    'match_score' => $match->match_score,
                    'eligible' => (bool) $match->eligible,
                    'match_breakdown' => $match->match_breakdown,
                    'match_details' => $match->match_details,
                    'eligibility_reasons' => $match->eligibility_reasons,
                ]);
        }

        return Inertia::render('proc/requests/show', [
            'request' => [
                'id' => $procurementRequest->id,
                'user_id' => $procurementRequest->user_id,
                'procurement_type' => $procurementRequest->procurement_type,
                'primary_business_category' => $procurementRequest->primary_business_category,
                'subcategory' => $procurementRequest->subcategory,
                'specialization' => $procurementRequest->specialization,
                'number_of_suppliers_required' => $procurementRequest->number_of_suppliers_required,
                'purpose_notes' => $procurementRequest->purpose_notes,
                'established_before' => $procurementRequest->established_before,
                'established_after' => $procurementRequest->established_after,
                'minimum_capital' => $procurementRequest->minimum_capital,
                'prefer_successful_suppliers' => (bool) $procurementRequest->prefer_successful_suppliers,
                'require_valid_trade_license' => (bool) $procurementRequest->require_valid_trade_license,
                'require_tax_clearance' => (bool) $procurementRequest->require_tax_clearance,
                'require_business_registration' => (bool) $procurementRequest->require_business_registration,
                'require_tin_certificate' => (bool) $procurementRequest->require_tin_certificate,
                'require_vat_registration_certificate' => (bool) $procurementRequest->require_vat_registration_certificate,
                'require_egp_registration_letter' => (bool) $procurementRequest->require_egp_registration_letter,
                'minimum_similar_contracts' => $procurementRequest->minimum_similar_contracts,
                'look_back_years' => $procurementRequest->look_back_years,
                'minimum_contract_value' => $procurementRequest->minimum_contract_value,
                'minimum_annual_turnover' => $procurementRequest->minimum_annual_turnover,
                'production_capacity_multiple' => $procurementRequest->production_capacity_multiple,
                'status' => $procurementRequest->status,
                'ro_number' => $procurementRequest->ro_number,
                'ro_document_url' => $procurementRequest->ro_document ? route('procurement.requests.ro-document.view', $procurementRequest->id) : null,
                'tech_spec_document_url' => $procurementRequest->tech_spec_document ? route('procurement.requests.tech-spec-document.view', $procurementRequest->id) : null,
                'created_at' => $procurementRequest->created_at?->toIso8601String(),
                'submitted_at' => $procurementRequest->submitted_at?->toIso8601String(),
                'user' => $procurementRequest->user ? [
                    'name' => $procurementRequest->user->name,
                ] : null,
            ],
            'approvedSuppliers' => $approvedSuppliers,
            'matchingResults' => $matchingResults,
        ]);
    }

    public function store(StoreProcurementRequestRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = $request->user()->id;
        $data['status'] = 'submitted';
        $data['submitted_at'] = now();
        unset($data['ro_document']);
        unset($data['tech_spec_document']);

        $procurementRequest = ProcurementRequest::create($data);

        if ($request->hasFile('ro_document')) {
            $procurementRequest->update(['ro_document' => $request->file('ro_document')->store('procurement-ro-documents', 'public')]);
        }

        if ($request->hasFile('tech_spec_document')) {
            $procurementRequest->update(['tech_spec_document' => $request->file('tech_spec_document')->store('procurement-tech-spec-documents', 'public')]);
        }

        return redirect()->route('procurement.request-supplier')->with('success', true);
    }

    public function viewRoDocument(Request $request, $procurementRequest)
    {
        $query = ProcurementRequest::query();

        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }

        $procurementRequest = $query->findOrFail($procurementRequest);

        abort_if(empty($procurementRequest->ro_document), 404);

        $path = Storage::disk('public')->path($procurementRequest->ro_document);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function viewTechSpecDocument(Request $request, $procurementRequest)
    {
        $query = ProcurementRequest::query();

        if ($request->user()->role !== 'admin') {
            $query->where('user_id', $request->user()->id);
        }

        $procurementRequest = $query->findOrFail($procurementRequest);

        abort_if(empty($procurementRequest->tech_spec_document), 404);

        $path = Storage::disk('public')->path($procurementRequest->tech_spec_document);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }
}
