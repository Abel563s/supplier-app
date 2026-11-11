<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\BankFinancialRequest;
use App\Http\Requests\Supplier\BusinessScopeRequest;
use App\Http\Requests\Supplier\ContactLocationRequest;
use App\Http\Requests\Supplier\LegalEntityRequest;
use App\Http\Requests\Supplier\OwnershipRequest;
use App\Http\Requests\Supplier\SubmissionsRequest;
use App\Models\Supplier;
use App\Models\SupplierContract;
use App\Models\SupplierDocument;
use App\Models\SupplierStatusHistory;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class RegistrationController extends Controller
{
    public function showStep(Request $request, int $step)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        $stepViews = [
            1 => 'supplier/registration/legal-entity',
            2 => 'supplier/registration/contact',
            3 => 'supplier/registration/business-scope',
            4 => 'supplier/registration/bank-financial',
            5 => 'supplier/registration/ownership',
            6 => 'supplier/registration/documents',
            7 => 'supplier/registration/declarations',
        ];

        $stepData = match ($step) {
            3 => ['supplier' => $supplier, 'contracts' => $supplier->contracts()->orderBy('created_at')->get()],
            6 => [
                'supplier' => $supplier,
                'documents' => $supplier->documents()->orderBy('document_type')->orderByDesc('uploaded_at')->orderByDesc('id')->get(),
                'documentTypes' => SupplierDocument::catalog(),
                'canRemoveDocuments' => $supplier->submitted_at === null,
            ],
            7 => ['supplier' => $supplier],
            default => ['supplier' => $supplier],
        };

        $stepData['step'] = $step;
        $stepData['supplier'] = $supplier;
        $stepData['completion'] = $this->calculateCompletion($request->user(), $step);

        return Inertia::render($stepViews[$step] ?? 'supplier/dashboard', $stepData);
    }

    /**
     * Validate the business scope step, accepting procurement types as an array or a comma-separated string.
     *
     * @return array<string, mixed>
     */
    protected function validateBusinessScope(Request $request): array
    {
        $procurementType = $request->input('procurement_type');

        $request->merge([
            'procurement_type' => Supplier::normalizeProcurementTypes($procurementType),
        ]);

        return $request->validate((new BusinessScopeRequest)->rules(), (new BusinessScopeRequest)->messages());
    }

    public function storeStep(Request $request, int $step, NotificationService $notificationService)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        $previousStatus = $supplier->status;

        $validated = match ($step) {
            1 => $request->validate((new LegalEntityRequest)->rules(), (new LegalEntityRequest)->messages()),
            2 => $request->validate((new ContactLocationRequest)->rules(), (new ContactLocationRequest)->messages()),
            3 => $this->validateBusinessScope($request),
            4 => $request->validate((new BankFinancialRequest)->rules(), (new BankFinancialRequest)->messages()),
            5 => $request->validate((new OwnershipRequest)->rules(), (new OwnershipRequest)->messages()),
            7 => $request->validate(['declaration_confirmed' => ['required', 'accepted']]),
            default => abort(404),
        };

        if (isset($validated['procurement_type']) && is_array($validated['procurement_type'])) {
            $validated['procurement_type'] = implode(',', $validated['procurement_type']);
        }

        $supplier->fill($validated);
        $supplier->save();
        $this->resolveCorrectionRequestsForStep($supplier, $step, $request->user());

        $currentStatus = $supplier->status;

        $isResubmission = $previousStatus === 'needs_correction' && $currentStatus === 'submitted';
        $isFreshSubmission = ! in_array($previousStatus, ['submitted', 'needs_correction'], true) && $currentStatus === 'submitted';
        $isUpdate = $previousStatus === 'submitted' && $currentStatus === 'submitted';

        if ($step === 7) {
            $supplier->update([
                'status' => $supplier->correctionRequests()->whereNull('resolved_at')->exists() ? 'needs_correction' : 'submitted',
                'submitted_at' => now(),
            ]);

            $currentStatus = $supplier->fresh()->status;

            if ($currentStatus === 'submitted') {
                if ($previousStatus === 'needs_correction') {
                    $notificationService->notifySupplierResubmitted($supplier);
                } else {
                    $notificationService->notifySupplierRegistered($supplier);
                }

                $notificationService->notifySupplierStatusChanged($supplier, 'submitted');
            }

            return redirect()->route('supplier.registration.submitted')->with('success', 'Registration submitted successfully.');
        }

        if ($isResubmission) {
            $notificationService->notifySupplierResubmitted($supplier);
            $notificationService->notifySupplierStatusChanged($supplier, 'submitted');
        } elseif ($isUpdate) {
            $notificationService->notifySupplierUpdated($supplier);
        }

        $nextRoutes = [
            1 => 'supplier.registration.contact',
            2 => 'supplier.registration.business-scope',
            3 => 'supplier.registration.bank-financial',
            4 => 'supplier.registration.ownership',
            5 => 'supplier.registration.documents',
            6 => 'supplier.registration.declarations',
        ];

        return redirect()->route($nextRoutes[$step] ?? 'supplier.registration.dashboard')->with('success', 'Step saved successfully.');
    }

    private function resolveCorrectionRequestsForStep(Supplier $supplier, int $step, User $user): void
    {
        $sections = [
            1 => 'legal_entity',
            2 => 'contact',
            3 => 'business_scope',
            4 => 'financial',
            5 => 'ownership',
            7 => 'declaration',
        ];

        if ($step === 6) {
            $section = 'documents';
        } else {
            $section = $sections[$step] ?? null;
        }

        if ($section === null) {
            return;
        }

        $supplier->correctionRequests()
            ->where('section', $section)
            ->whereNull('resolved_at')
            ->update([
                'resolved_at' => now(),
                'resolved_by' => $user->id,
            ]);

        if (
            $supplier->status === 'needs_correction'
            && ! $supplier->correctionRequests()->whereNull('resolved_at')->exists()
        ) {
            $previousStatus = $supplier->status;
            $supplier->update(['status' => 'submitted']);

            SupplierStatusHistory::create([
                'supplier_id' => $supplier->id,
                'previous_status' => $previousStatus,
                'new_status' => 'submitted',
                'changed_by' => $user->id,
                'notes' => 'All requested corrections were completed by the supplier.',
            ]);
        }
    }

    public function storeDocuments(Request $request)
    {
        return redirect()->route('supplier.registration.declarations');
    }

    public function contracts(Request $request)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json($supplier->contracts()->orderBy('created_at')->get());
    }

    public function storeContract(Request $request)
    {
        $request->validate([
            'client_project_name' => 'required|string|max:255',
            'nature_similarity' => 'required|string|max:255',
            'contract_value' => 'required|string|max:255',
            'contract_date' => 'required|date',
        ]);

        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);
        $contract = $supplier->contracts()->create($request->only([
            'client_project_name', 'nature_similarity', 'contract_value', 'contract_date',
        ]));

        return response()->json($contract, 201);
    }

    public function updateContract(Request $request, SupplierContract $contract)
    {
        $request->validate([
            'client_project_name' => 'required|string|max:255',
            'nature_similarity' => 'required|string|max:255',
            'contract_value' => 'required|string|max:255',
            'contract_date' => 'required|date',
        ]);

        $contract->update($request->only([
            'client_project_name', 'nature_similarity', 'contract_value', 'contract_date',
        ]));

        return response()->json($contract);
    }

    public function destroyContract(Request $request, SupplierContract $contract)
    {
        $contract->delete();

        return response()->json(null, 204);
    }

    public function documents(Request $request)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json($supplier->documents()->orderBy('document_type')->get());
    }

    public function uploadDocument(Request $request, NotificationService $notificationService)
    {
        $request->validate([
            'document_type' => ['required', 'string', Rule::in(SupplierDocument::TYPES)],
            'file' => ['required', 'file', 'mimes:pdf', 'max:5120'],
        ]);

        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);
        $previousStatus = $supplier->status;
        $path = $request->file('file')->store('supplier-documents', 'public');

        $document = $supplier->documents()->create([
            'document_type' => $request->document_type,
            'file_name' => $request->file('file')->getClientOriginalName(),
            'file_path' => $path,
            'file_size' => $request->file('file')->getSize(),
            'file_type' => $request->file('file')->getClientOriginalExtension(),
            'uploaded_at' => now(),
        ]);
        $this->resolveCorrectionRequestsForStep($supplier, 6, $request->user());

        $currentStatus = $supplier->status;

        if ($previousStatus === 'needs_correction' && $currentStatus === 'submitted') {
            $notificationService->notifySupplierResubmitted($supplier);
            $notificationService->notifySupplierStatusChanged($supplier, 'submitted');
        }

        if ($currentStatus === 'submitted') {
            $notificationService->notifySupplierDocumentsSubmitted($supplier);
        }

        return response()->json($document, 201);
    }

    public function removeDocument(Request $request, SupplierDocument $document)
    {
        $supplier = Supplier::where('user_id', $request->user()->id)->firstOrFail();

        if ($document->supplier_id !== $supplier->id) {
            abort(403);
        }

        abort_if($supplier->submitted_at !== null, 403, 'Submitted supplier documents can only be removed by an administrator.');

        if (\Storage::disk('public')->exists($document->file_path)) {
            \Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json(null, 204);
    }

    public function viewDocument(Request $request, SupplierDocument $document)
    {
        $supplier = Supplier::where('user_id', $request->user()->id)->firstOrFail();

        abort_if($document->supplier_id !== $supplier->id, 404);

        $path = Storage::disk('public')->path($document->file_path);

        if (! file_exists($path)) {
            abort(404);
        }

        return response()->file($path);
    }

    public function declarations(Request $request)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json(['declaration_confirmed' => (bool) $supplier->declaration_confirmed]);
    }

    public function submit(Request $request, NotificationService $notificationService)
    {
        $validated = $request->validate((new SubmissionsRequest)->rules());

        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        $requiredDocumentTypes = collect(SupplierDocument::REQUIRED_TYPES);
        $missingDocuments = $requiredDocumentTypes->filter(function ($type) use ($supplier) {
            return ! $supplier->documents()->where('document_type', $type)->exists();
        });

        if ($missingDocuments->isNotEmpty()) {
            return back()->withErrors(['documents' => 'The following required documents are missing: '.$missingDocuments->join(', ').'.'])->withInput();
        }

        $previousStatus = $supplier->status;

        $supplier->update([
            'declaration_confirmed' => true,
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        if ($previousStatus === 'needs_correction') {
            $notificationService->notifySupplierResubmitted($supplier);
        } else {
            $notificationService->notifySupplierRegistered($supplier);
        }

        $notificationService->notifySupplierStatusChanged($supplier, 'submitted');

        return redirect()->route('supplier.registration.submitted')->with('success', 'Registration submitted successfully.');
    }

    public function submitted()
    {
        return Inertia::render('supplier/registration/submitted');
    }

    public function calculateCompletion(?User $user, int $currentStep = 1): array
    {
        $supplier = $user ? Supplier::firstOrCreate(['user_id' => $user->id]) : new Supplier;

        $steps = [
            ['number' => 1, 'title' => 'Legal Entity & Identification', 'status' => 'not-started', 'href' => '/supplier/registration/legal-entity', 'metadata' => '10 required fields'],
            ['number' => 2, 'title' => 'Contact & Location', 'status' => 'not-started', 'href' => '/supplier/registration/contact', 'metadata' => '7 required fields'],
            ['number' => 3, 'title' => 'Business Scope & Categories', 'status' => 'not-started', 'href' => '/supplier/registration/business-scope', 'metadata' => '4 required fields'],
            ['number' => 4, 'title' => 'Bank & Financial', 'status' => 'not-started', 'href' => '/supplier/registration/bank-financial', 'metadata' => 'Optional'],
            ['number' => 5, 'title' => 'Ownership & Signatory', 'status' => 'not-started', 'href' => '/supplier/registration/ownership', 'metadata' => '2 required fields'],
            ['number' => 6, 'title' => 'Supporting Documents', 'status' => 'not-started', 'href' => '/supplier/registration/documents', 'metadata' => count(SupplierDocument::REQUIRED_TYPES).' minimum documents'],
            ['number' => 7, 'title' => 'Declarations', 'status' => 'not-started', 'href' => '/supplier/registration/declarations', 'metadata' => 'Declaration confirmation'],
        ];

        $steps[0]['status'] = $this->getStepStatus($supplier, [
            'legal_form', 'country_of_registration', 'legal_name', 'tin',
            'business_registration_no', 'registered_capital', 'latest_annual_turnover', 'trade_license_renewed_date',
            'tax_clearance_from', 'tax_clearance_to',
        ]);

        $steps[1]['status'] = $this->getStepStatus($supplier, [
            'primary_contact_name', 'primary_phone', 'alternate_phone', 'primary_email', 'city', 'subcity', 'woreda',
        ]);

        $steps[2]['status'] = $this->getStepStatus($supplier, [
            'procurement_type', 'primary_business_category', 'sub_category', 'specialization',
        ]);

        $steps[3]['status'] = $this->getOptionalStepStatus($supplier, [
            'bank_name', 'branch_name', 'account_number', 'account_holder_name',
            'number_of_employees', 'technical_personnel', 'non_technical_personnel',
            'tax_clearance_from', 'tax_clearance_to', 'tax_clearance_fiscal_year',
            'subject_to_excise_tax', 'authorized_manufacturer_distributor',
        ]);

        $steps[4]['status'] = $this->getStepStatus($supplier, ['signatory_title', 'owner_ceo_name']);

        $steps[5]['status'] = $this->getDocumentsStatus($supplier);

        $steps[6]['status'] = $supplier->declaration_confirmed ? 'complete' : 'not-started';

        $completedSteps = array_filter($steps, fn ($s) => $s['status'] === 'complete');
        $percentageSteps = array_filter($steps, fn ($s) => $s['number'] !== 4);
        $percentage = $percentageSteps ? round((count($completedSteps) / count($percentageSteps)) * 100) : 0;

        return [
            'steps' => $steps,
            'currentStep' => $currentStep,
            'completedSteps' => count($completedSteps),
            'totalSteps' => count($percentageSteps),
            'percentage' => $percentage,
        ];
    }

    private function isFieldFilled(mixed $value): bool
    {
        return ! is_null($value) && $value !== '' && $value !== false;
    }

    private function getStepStatus($supplier, array $fields): string
    {
        $count = collect($fields)->filter(fn ($field) => $this->isFieldFilled($supplier->getAttribute($field)))->count();
        $total = count($fields);

        if ($count === $total) {
            return 'complete';
        }
        if ($count > 0) {
            return 'partial';
        }

        return 'not-started';
    }

    private function getOptionalStepStatus($supplier, array $fields): string
    {
        $count = collect($fields)->filter(fn ($field) => $this->isFieldFilled($supplier->getAttribute($field)))->count();

        if ($count > 0) {
            return 'complete';
        }

        return 'not-started';
    }

    private function getDocumentsStatus(Supplier $supplier): string
    {
        $uploadedTypes = $supplier->documents()->pluck('document_type');
        $requiredUploaded = $uploadedTypes->intersect(SupplierDocument::REQUIRED_TYPES)->count();

        if ($requiredUploaded === count(SupplierDocument::REQUIRED_TYPES)) {
            return 'complete';
        }
        if ($uploadedTypes->isNotEmpty()) {
            return 'partial';
        }

        return 'not-started';
    }
}
