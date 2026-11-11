<?php

namespace App\Http\Controllers\Supplier;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $supplier = Supplier::firstOrCreate(['user_id' => $request->user()->id]);

        if ($supplier->status === 'submitted' || $supplier->status === 'approved') {
            return Inertia::render('supplier/dashboard', [
                'supplier' => $supplier,
                'completion' => $this->calculateCompletion($supplier),
                'supplierStatus' => $supplier->status,
                'lastSavedStep' => null,
                'correctionRequests' => $this->activeCorrectionRequests($supplier),
            ]);
        }

        $lastSavedStep = $this->getLastSavedStep($supplier);

        return Inertia::render('supplier/dashboard', [
            'supplier' => $supplier,
            'completion' => $this->calculateCompletion($supplier),
            'supplierStatus' => $supplier->status,
            'lastSavedStep' => $lastSavedStep,
            'correctionRequests' => $this->activeCorrectionRequests($supplier),
        ]);
    }

    private function activeCorrectionRequests(Supplier $supplier): array
    {
        return $supplier->correctionRequests()
            ->whereNull('resolved_at')
            ->latest('created_at')
            ->latest('id')
            ->get(['id', 'section', 'reason', 'created_at'])
            ->toArray();
    }

    private function calculateCompletion(Supplier $supplier): array
    {
        $step1Fields = [
            'legal_form', 'country_of_registration', 'legal_name', 'tin',
            'business_registration_no', 'registered_capital', 'latest_annual_turnover', 'trade_license_renewed_date',
        ];

        $step2Fields = ['primary_contact_name', 'primary_phone', 'primary_email', 'city', 'woreda'];

        $step3Fields = ['procurement_type', 'primary_business_category', 'sub_category'];

        $step4Fields = [
            'bank_name', 'branch_name', 'account_number', 'account_holder_name',
            'number_of_employees', 'technical_personnel', 'non_technical_personnel',
            'tax_clearance_expiry', 'tax_clearance_fiscal_year',
            'subject_to_excise_tax', 'authorized_manufacturer_distributor',
        ];

        $step5Fields = ['signatory_title'];

        $step1Status = $this->getStepStatus($supplier, $step1Fields);
        $step2Status = $this->getStepStatus($supplier, $step2Fields);
        $step3Status = $this->getStepStatus($supplier, $step3Fields);
        $step4Status = $this->getStepStatus($supplier, $step4Fields);
        $step5Status = $this->getStepStatus($supplier, $step5Fields);

        $step6Status = $this->getDocumentsStatus($supplier);
        $step7Status = $supplier->declaration_confirmed ? 'complete' : 'not-started';

        $steps = [
            ['number' => 1, 'title' => 'Legal Entity & Identification', 'status' => $step1Status, 'href' => '/supplier/registration/legal-entity', 'metadata' => '8 required fields'],
            ['number' => 2, 'title' => 'Contact & Location', 'status' => $step2Status, 'href' => '/supplier/registration/contact', 'metadata' => '5 required fields'],
            ['number' => 3, 'title' => 'Business Scope & Categories', 'status' => $step3Status, 'href' => '/supplier/registration/business-scope', 'metadata' => '3 required fields'],
            ['number' => 4, 'title' => 'Bank & Financial', 'status' => $step4Status, 'href' => '/supplier/registration/bank-financial', 'metadata' => 'Optional'],
            ['number' => 5, 'title' => 'Ownership & Signatory', 'status' => $step5Status, 'href' => '/supplier/registration/ownership', 'metadata' => '1 required field'],
            ['number' => 6, 'title' => 'Supporting Documents', 'status' => $step6Status, 'href' => '/supplier/registration/documents', 'metadata' => count(SupplierDocument::REQUIRED_TYPES).' minimum documents'],
            ['number' => 7, 'title' => 'Declarations', 'status' => $step7Status, 'href' => '/supplier/registration/declarations', 'metadata' => 'Not completed'],
        ];

        $completedSteps = array_filter($steps, fn ($s) => $s['status'] === 'complete');
        $totalSteps = count($steps);
        $completedCount = count($completedSteps);
        $percentage = $totalSteps ? round(($completedCount / $totalSteps) * 100) : 0;

        return [
            'steps' => $steps,
            'completedSteps' => $completedCount,
            'totalSteps' => $totalSteps,
            'percentage' => $percentage,
        ];
    }

    private function getLastSavedStep(Supplier $supplier): int
    {
        $step1Fields = [
            'legal_form', 'country_of_registration', 'legal_name', 'tin',
            'business_registration_no', 'registered_capital', 'latest_annual_turnover', 'trade_license_renewed_date',
        ];

        $step2Fields = ['primary_contact_name', 'primary_phone', 'primary_email', 'city', 'woreda'];

        $step3Fields = ['procurement_type', 'primary_business_category', 'sub_category'];

        $step4Fields = [
            'bank_name', 'branch_name', 'account_number', 'account_holder_name',
            'number_of_employees', 'technical_personnel', 'non_technical_personnel',
            'tax_clearance_expiry', 'tax_clearance_fiscal_year',
            'subject_to_excise_tax', 'authorized_manufacturer_distributor',
        ];

        $step5Fields = ['signatory_title'];

        $step1Filled = array_filter($step1Fields, fn ($field) => $this->isFieldFilled($supplier, $field));
        $step2Filled = array_filter($step2Fields, fn ($field) => $this->isFieldFilled($supplier, $field));
        $step3Filled = array_filter($step3Fields, fn ($field) => $this->isFieldFilled($supplier, $field));
        $step4Filled = array_filter($step4Fields, fn ($field) => $this->isFieldFilled($supplier, $field));
        $step5Filled = array_filter($step5Fields, fn ($field) => $this->isFieldFilled($supplier, $field));

        $hasDocuments = $supplier->documents()->count() > 0;
        $hasDeclaration = (bool) $supplier->declaration_confirmed;

        if ($hasDeclaration) {
            return 7;
        }
        if ($hasDocuments) {
            return 6;
        }
        if (! empty($step5Filled)) {
            return 5;
        }
        if (! empty($step4Filled)) {
            return 4;
        }
        if (! empty($step3Filled)) {
            return 3;
        }
        if (! empty($step2Filled)) {
            return 2;
        }
        if (! empty($step1Filled)) {
            return 1;
        }

        return 1;
    }

    private function getStepStatus(Supplier $supplier, array $fields): string
    {
        $filled = array_filter($fields, fn ($field) => $this->isFieldFilled($supplier, $field));
        $count = count($filled);
        $total = count($fields);

        if ($count === $total) {
            return 'complete';
        }
        if ($count > 0) {
            return 'partial';
        }

        return 'not-started';
    }

    private function isFieldFilled(Supplier $supplier, string $field): bool
    {
        $value = $supplier->getAttribute($field);

        if (is_null($value)) {
            return false;
        }

        if ($value === '' || $value === false) {
            return false;
        }

        return true;
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
