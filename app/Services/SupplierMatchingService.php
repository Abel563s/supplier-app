<?php

namespace App\Services;

use App\Models\Category;
use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestMatch;
use App\Models\ProcurementRequestSupplier;
use App\Models\Supplier;
use App\Models\SupplierDocument;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class SupplierMatchingService
{
    public function __construct(
        protected array $weights = [
            'category' => 25,
            'sub_category' => 20,
            'compliance' => 20,
            'experience' => 15,
            'financial' => 10,
            'performance' => 10,
        ]
    ) {}

    public function runMatching(ProcurementRequest $request): array
    {
        $suppliers = $this->getBaseSuppliers($request);

        foreach ($suppliers as $supplier) {
            $eligibility = $this->checkEligibility($request, $supplier);
            $match = $this->calculateMatch($request, $supplier);
            $match['eligible'] = $eligibility['eligible'];
            $match['eligibility_reasons'] = $eligibility['reasons'];
            $match['match_details'] = array_values(array_unique(array_merge($match['match_details'], $eligibility['reasons'])));

            $this->saveMatch($request, $supplier, $match);
        }

        return $this->getRankedMatches($request);
    }

    protected function getBaseSuppliers(ProcurementRequest $request): Collection
    {
        return Supplier::query()
            ->where('status', 'approved')
            ->with('documents')
            ->withCount('contracts')
            ->get();
    }

    /**
     * Get the procurement types supported by the supplier.
     *
     * @return array<int, string>
     */
    protected function supplierProcurementTypes(Supplier $supplier): array
    {
        return Supplier::normalizeProcurementTypes($supplier->procurement_type);
    }

    protected function supplierHasRequiredDocument(Supplier $supplier, string $documentType): bool
    {
        return $supplier->documents->contains(fn (SupplierDocument $document): bool => $document->document_type === $documentType
            && in_array($document->review_status, ['approved', 'pending', 'verified'], true)
        );
    }

    protected function requestCategory(ProcurementRequest $request): ?string
    {
        if (filled($request->primary_business_category)) {
            return trim($request->primary_business_category);
        }

        return $request->category_id
            ? Category::find($request->category_id)?->name
            : null;
    }

    protected function sameRequirement(?string $requested, ?string $supplierValue): bool
    {
        return filled($requested)
            && filled($supplierValue)
            && mb_strtolower(trim($requested)) === mb_strtolower(trim($supplierValue));
    }

    protected function checkEligibility(ProcurementRequest $request, Supplier $supplier): array
    {
        $reasons = [];

        // Procurement type check
        $supplierProcurementTypes = $this->supplierProcurementTypes($supplier);
        $requestedProcurementTypes = $request->procurement_type === 'non-consulting'
            ? ['non-consulting', 'service']
            : [$request->procurement_type];

        if ($request->procurement_type && count(array_intersect($requestedProcurementTypes, $supplierProcurementTypes)) === 0) {
            $reasons[] = 'Supplier does not support the requested procurement type.';
        }

        // Business category check
        $categoryName = $this->requestCategory($request);
        if ($categoryName && ! $this->sameRequirement($categoryName, $supplier->primary_business_category)) {
            $reasons[] = "Primary business category mismatch. Requested: {$categoryName}, Supplier: {$supplier->primary_business_category}.";
        }

        if ($request->subcategory && ! $this->sameRequirement($request->subcategory, $supplier->sub_category)) {
            $reasons[] = "Sub-category mismatch. Requested: {$request->subcategory}, Supplier: ".($supplier->sub_category ?: 'not provided').'.';
        }

        if ($request->specialization && ! $this->sameRequirement($request->specialization, $supplier->specialization)) {
            $reasons[] = "Specialization mismatch. Requested: {$request->specialization}, Supplier: ".($supplier->specialization ?: 'not provided').'.';
        }

        $requiredDocuments = [
            'business_registration' => 'Business Registration',
            'business_license' => 'Business License',
            'tin_certificate' => 'TIN Certificate',
            'vat_certificate' => 'VAT Registration Certificate',
            'egp_registration_letter' => 'EGP Registration Letter',
        ];

        if ($request->procurement_type === 'supply') {
            $requiredDocuments['tax_clearance_certificate'] = 'Tax Clearance Certificate';
        }

        foreach ($requiredDocuments as $documentType => $label) {
            if (! $this->supplierHasRequiredDocument($supplier, $documentType)) {
                $reasons[] = "Required {$label} document is missing or not accepted.";
            }
        }

        if (! $supplier->trade_license_renewed_date || $supplier->trade_license_renewed_date < today()) {
            $reasons[] = 'Business license is missing or expired.';
        }

        if ($request->procurement_type === 'supply') {
            $taxClearanceExpiry = $supplier->tax_clearance_to ?: $supplier->tax_clearance_expiry;

            if (! $taxClearanceExpiry || $taxClearanceExpiry < today()) {
                $reasons[] = 'Tax clearance is missing or expired.';
            }
        }

        // Capital check
        if ($request->minimum_capital) {
            if (! $supplier->registered_capital || $supplier->registered_capital < $request->minimum_capital) {
                $reasons[] = 'Registered capital below requirement. Required: ETB '.number_format($request->minimum_capital).', Supplier: ETB '.number_format($supplier->registered_capital ?? 0).'.';
            }
        }

        // Annual turnover check
        if ($request->minimum_annual_turnover) {
            if (! $supplier->latest_annual_turnover || $supplier->latest_annual_turnover < $request->minimum_annual_turnover) {
                $reasons[] = 'Annual turnover below requirement. Required: ETB '.number_format($request->minimum_annual_turnover).', Supplier: ETB '.number_format($supplier->latest_annual_turnover ?? 0).'.';
            }
        }

        // Company age check
        if ($request->established_before) {
            if (! $supplier->date_established || $supplier->date_established > $request->established_before) {
                $reasons[] = 'Supplier does not satisfy established-before requirement.';
            }
        }

        if ($request->established_after) {
            if (! $supplier->date_established || $supplier->date_established < $request->established_after) {
                $reasons[] = 'Supplier does not satisfy established-after requirement.';
            }
        }

        // Similar contracts check
        if ($request->minimum_similar_contracts) {
            $contractsQuery = $supplier->contracts();

            if ($request->look_back_years) {
                $contractsQuery->where('contract_date', '>=', Carbon::now()->subYears($request->look_back_years));
            }

            if ($request->minimum_contract_value) {
                $contractsQuery->where('contract_value', '>=', $request->minimum_contract_value);
            }

            $qualifyingCount = $contractsQuery->count();

            if ($qualifyingCount < $request->minimum_similar_contracts) {
                $reasons[] = "Insufficient similar contracts. Required: {$request->minimum_similar_contracts}, Found: {$qualifyingCount}.";
            }
        }

        return [
            'eligible' => empty($reasons),
            'reasons' => $reasons,
        ];
    }

    protected function calculateMatch(ProcurementRequest $request, Supplier $supplier): array
    {
        $breakdown = [
            'category' => ['score' => 0, 'max' => $this->weights['category'], 'details' => []],
            'sub_category' => ['score' => 0, 'max' => $this->weights['sub_category'], 'details' => []],
            'compliance' => ['score' => 0, 'max' => $this->weights['compliance'], 'details' => []],
            'experience' => ['score' => 0, 'max' => $this->weights['experience'], 'details' => []],
            'financial' => ['score' => 0, 'max' => $this->weights['financial'], 'details' => []],
            'performance' => ['score' => 0, 'max' => $this->weights['performance'], 'details' => []],
        ];
        $matchDetails = [];

        $categoryName = $this->requestCategory($request);
        $categoryChecks = 0;
        $categoryMatches = 0;
        if ($categoryName) {
            $categoryChecks++;
            if ($this->sameRequirement($categoryName, $supplier->primary_business_category)) {
                $categoryMatches++;
                $breakdown['category']['details'][] = "Primary business category matches: {$categoryName}.";
            } else {
                $breakdown['category']['details'][] = "Primary business category mismatch. Requested: {$categoryName}; supplier: ".($supplier->primary_business_category ?: 'not provided').'.';
            }
        }

        if ($request->procurement_type) {
            $categoryChecks++;
            $requestedProcurementTypes = $request->procurement_type === 'non-consulting'
                ? ['non-consulting', 'service']
                : [$request->procurement_type];
            $supplierProcurementTypes = $this->supplierProcurementTypes($supplier);

            if (count(array_intersect($requestedProcurementTypes, $supplierProcurementTypes)) > 0) {
                $categoryMatches++;
                $breakdown['category']['details'][] = "Supplier supports the requested procurement type: {$request->procurement_type}.";
            } else {
                $breakdown['category']['details'][] = "Procurement type mismatch. Requested: {$request->procurement_type}; supplier: ".($supplier->procurement_type ?: 'not provided').'.';
            }
        }

        $breakdown['category']['score'] = $categoryChecks > 0
            ? (int) round(($categoryMatches / $categoryChecks) * $this->weights['category'])
            : $this->weights['category'];
        if ($breakdown['category']['details'] === []) {
            $breakdown['category']['details'][] = 'No procurement type or category filter was submitted.';
        }
        $matchDetails = array_merge($matchDetails, $breakdown['category']['details']);

        $businessScopeChecks = 0;
        $businessScopeMatches = 0;
        foreach ([
            'Sub-category' => [$request->subcategory, $supplier->sub_category],
            'Specialization' => [$request->specialization, $supplier->specialization],
        ] as $label => [$requestedValue, $supplierValue]) {
            if (! filled($requestedValue)) {
                continue;
            }

            $businessScopeChecks++;
            if ($this->sameRequirement($requestedValue, $supplierValue)) {
                $businessScopeMatches++;
                $breakdown['sub_category']['details'][] = "{$label} matches: {$requestedValue}.";
            } else {
                $breakdown['sub_category']['details'][] = "{$label} mismatch. Requested: {$requestedValue}; supplier: ".($supplierValue ?: 'not provided').'.';
            }
        }
        $breakdown['sub_category']['score'] = $businessScopeChecks > 0
            ? (int) round(($businessScopeMatches / $businessScopeChecks) * $this->weights['sub_category'])
            : $this->weights['sub_category'];
        if ($breakdown['sub_category']['details'] === []) {
            $breakdown['sub_category']['details'][] = 'No sub-category or specialization filter was submitted.';
        }
        $matchDetails = array_merge($matchDetails, $breakdown['sub_category']['details']);

        $requiredDocuments = [
            'business_registration' => 'Business Registration',
            'business_license' => 'Business License',
            'tin_certificate' => 'TIN Certificate',
            'vat_certificate' => 'VAT Registration Certificate',
            'egp_registration_letter' => 'EGP Registration Letter',
        ];
        if ($request->procurement_type === 'supply') {
            $requiredDocuments['tax_clearance_certificate'] = 'Tax Clearance Certificate';
        }

        $complianceChecks = 0;
        $complianceMatches = 0;
        foreach ($requiredDocuments as $documentType => $label) {
            $complianceChecks++;
            $isCompliant = $this->supplierHasRequiredDocument($supplier, $documentType);

            if ($documentType === 'business_license') {
                $isCompliant = $isCompliant
                    && $supplier->trade_license_renewed_date
                    && $supplier->trade_license_renewed_date >= today();
            }
            if ($documentType === 'tax_clearance_certificate') {
                $taxClearanceExpiry = $supplier->tax_clearance_to ?: $supplier->tax_clearance_expiry;
                $isCompliant = $isCompliant && $taxClearanceExpiry && $taxClearanceExpiry >= today();
            }

            if ($isCompliant) {
                $complianceMatches++;
                $breakdown['compliance']['details'][] = "{$label} document is on file and meets the request.";
            } else {
                $breakdown['compliance']['details'][] = "{$label} document is missing, unaccepted, or expired.";
            }
        }
        $breakdown['compliance']['score'] = $complianceChecks > 0
            ? (int) round(($complianceMatches / $complianceChecks) * $this->weights['compliance'])
            : $this->weights['compliance'];
        $matchDetails = array_merge($matchDetails, $breakdown['compliance']['details']);

        $contractsQuery = $supplier->contracts();
        if ($request->look_back_years) {
            $contractsQuery->where('contract_date', '>=', Carbon::now()->subYears($request->look_back_years));
        }
        if ($request->minimum_contract_value) {
            $contractsQuery->where('contract_value', '>=', $request->minimum_contract_value);
        }
        $qualifyingCount = $contractsQuery->count();

        if ($request->minimum_similar_contracts) {
            $experiencePercentage = min(100, (int) round(($qualifyingCount / $request->minimum_similar_contracts) * 100));
            $breakdown['experience']['score'] = (int) round(($experiencePercentage / 100) * $this->weights['experience']);
            $breakdown['experience']['details'][] = "{$qualifyingCount} qualifying contracts; {$request->minimum_similar_contracts} required.";
        } elseif ($request->minimum_contract_value) {
            $breakdown['experience']['score'] = $qualifyingCount > 0 ? $this->weights['experience'] : 0;
            $breakdown['experience']['details'][] = "{$qualifyingCount} contracts meet the minimum value of ETB ".number_format($request->minimum_contract_value).'.';
        } elseif ($qualifyingCount > 0) {
            $breakdown['experience']['score'] = (int) round(0.5 * $this->weights['experience']);
            $breakdown['experience']['details'][] = "{$qualifyingCount} contract records on file; no contract threshold was set.";
        } else {
            $breakdown['experience']['score'] = $this->weights['experience'];
            $breakdown['experience']['details'][] = 'No contract threshold was submitted.';
        }
        $matchDetails = array_merge($matchDetails, $breakdown['experience']['details']);

        $financialScore = 0;
        $financialChecks = 0;
        foreach ([
            'minimum_capital' => ['label' => 'Registered capital', 'value' => $supplier->registered_capital],
            'minimum_annual_turnover' => ['label' => 'Annual turnover', 'value' => $supplier->latest_annual_turnover],
        ] as $field => $criterion) {
            $requiredValue = $request->{$field};
            if (! $requiredValue) {
                continue;
            }

            $financialChecks++;
            if ($criterion['value'] && $criterion['value'] >= $requiredValue) {
                $financialScore++;
                $breakdown['financial']['details'][] = "{$criterion['label']} meets the ETB ".number_format($requiredValue).' minimum (supplier: ETB '.number_format($criterion['value']).').';
            } else {
                $breakdown['financial']['details'][] = "{$criterion['label']} is below the ETB ".number_format($requiredValue).' minimum (supplier: ETB '.number_format($criterion['value'] ?? 0).').';
            }
        }
        $breakdown['financial']['score'] = $financialChecks > 0
            ? (int) round(($financialScore / $financialChecks) * $this->weights['financial'])
            : $this->weights['financial'];
        if ($breakdown['financial']['details'] === []) {
            $breakdown['financial']['details'][] = 'No financial thresholds were submitted.';
        }
        $matchDetails = array_merge($matchDetails, $breakdown['financial']['details']);

        $breakdown['performance']['score'] = $this->weights['performance'];
        $breakdown['performance']['details'][] = 'No past performance requirement was submitted.';
        $matchDetails[] = $breakdown['performance']['details'][0];

        $totalScore = array_sum(array_column($breakdown, 'score'));

        return [
            'eligible' => true,
            'match_score' => min($totalScore, 100),
            'match_breakdown' => $breakdown,
            'eligibility_reasons' => [],
            'match_details' => $matchDetails,
        ];
    }

    protected function emptyBreakdown(): array
    {
        return [
            'category' => ['score' => 0, 'max' => $this->weights['category'], 'details' => []],
            'sub_category' => ['score' => 0, 'max' => $this->weights['sub_category'], 'details' => []],
            'compliance' => ['score' => 0, 'max' => $this->weights['compliance'], 'details' => []],
            'experience' => ['score' => 0, 'max' => $this->weights['experience'], 'details' => []],
            'financial' => ['score' => 0, 'max' => $this->weights['financial'], 'details' => []],
            'performance' => ['score' => 0, 'max' => $this->weights['performance'], 'details' => []],
        ];
    }

    protected function saveMatch(ProcurementRequest $request, Supplier $supplier, array $match): void
    {
        ProcurementRequestMatch::updateOrCreate(
            [
                'procurement_request_id' => $request->id,
                'supplier_id' => $supplier->id,
            ],
            [
                'eligible' => $match['eligible'],
                'match_score' => $match['match_score'],
                'match_breakdown' => $match['match_breakdown'],
                'eligibility_reasons' => $match['eligibility_reasons'],
                'match_details' => $match['match_details'],
                'matched_at' => now(),
            ]
        );
    }

    public function getRankedMatches(ProcurementRequest $request): array
    {
        return ProcurementRequestMatch::query()
            ->where('procurement_request_id', $request->id)
            ->with(['supplier' => fn ($query) => $query->withCount('contracts')])
            ->orderByDesc('eligible')
            ->orderByDesc('match_score')
            ->get()
            ->map(function ($match) {
                return [
                    'id' => $match->supplier->id,
                    'legal_name' => $match->supplier->legal_name,
                    'trade_name' => $match->supplier->trade_name,
                    'primary_business_category' => $match->supplier->primary_business_category,
                    'sub_category' => $match->supplier->sub_category,
                    'specialization' => $match->supplier->specialization,
                    'procurement_type' => $match->supplier->procurement_type,
                    'registered_capital' => $match->supplier->registered_capital,
                    'latest_annual_turnover' => $match->supplier->latest_annual_turnover,
                    'contracts_count' => $match->supplier->contracts_count,
                    'date_established' => $match->supplier->date_established,
                    'trade_license_renewed_date' => $match->supplier->trade_license_renewed_date,
                    'tax_clearance_expiry' => $match->supplier->tax_clearance_to ?: $match->supplier->tax_clearance_expiry,
                    'number_of_employees' => $match->supplier->number_of_employees,
                    'annual_production_capacity' => $match->supplier->annual_production_capacity,
                    'capacity_unit' => $match->supplier->capacity_unit,
                    'match_score' => $match->match_score,
                    'eligible' => $match->eligible,
                    'match_breakdown' => $match->match_breakdown,
                    'match_details' => $match->match_details,
                    'eligibility_reasons' => $match->eligibility_reasons,
                ];
            })->toArray();
    }

    public function getMatchSummary(ProcurementRequest $request): array
    {
        $total = ProcurementRequestMatch::where('procurement_request_id', $request->id)->count();
        $eligible = ProcurementRequestMatch::where('procurement_request_id', $request->id)->where('eligible', true)->count();
        $selected = ProcurementRequestSupplier::where('procurement_request_id', $request->id)->where('selected', true)->count();
        $approved = ProcurementRequestSupplier::where('procurement_request_id', $request->id)->where('approved', true)->count();

        return [
            'total_evaluated' => $total,
            'eligible_count' => $eligible,
            'selected_count' => $selected,
            'approved_count' => $approved,
            'required_count' => $request->number_of_suppliers_required,
        ];
    }
}
