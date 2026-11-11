<?php

use App\Models\Category;
use App\Models\ProcurementRequest;
use App\Models\Supplier;
use App\Models\SupplierContract;
use App\Models\SupplierDocument;
use App\Models\User;
use App\Services\SupplierMatchingService;

function createSupplierMatchingDocuments(Supplier $supplier, bool $requiresTaxClearance = true, array $omittedTypes = []): void
{
    $documentTypes = [
        'business_registration',
        'business_license',
        'tin_certificate',
        'vat_certificate',
        'egp_registration_letter',
    ];

    if ($requiresTaxClearance) {
        $documentTypes[] = 'tax_clearance_certificate';
    }

    foreach (array_diff($documentTypes, $omittedTypes) as $documentType) {
        SupplierDocument::factory()->create([
            'supplier_id' => $supplier->id,
            'document_type' => $documentType,
            'review_status' => 'verified',
        ]);
    }
}

it('ranks eligible suppliers and rejects expired compliance', function () {
    $category = Category::create([
        'name' => 'Construction Materials',
        'slug' => 'construction-materials',
        'type' => 'business',
        'sort_order' => 1,
    ]);

    $user = User::factory()->create();

    $eligibleSupplier = Supplier::create([
        'user_id' => $user->id,
        'status' => 'approved',
        'legal_name' => 'ABC Steel PLC',
        'trade_name' => 'ABC Steel',
        'procurement_type' => 'supply',
        'primary_business_category' => 'Construction Materials',
        'sub_category' => 'Steel & Reinforcement',
        'registered_capital' => 25_000_000,
        'trade_license_renewed_date' => now()->addYear(),
        'tax_clearance_expiry' => now()->addYear(),
        'subject_to_excise_tax' => true,
        'authorized_manufacturer_distributor' => true,
        'date_established' => now()->subYears(10)->toDateString(),
        'latest_annual_turnover' => 40_000_000,
    ]);

    SupplierContract::create([
        'supplier_id' => $eligibleSupplier->id,
        'client_project_name' => 'Bridge Project',
        'nature_similarity' => 'Steel supply',
        'contract_value' => 5_000_000,
        'contract_date' => now()->subYears(2),
    ]);

    SupplierContract::create([
        'supplier_id' => $eligibleSupplier->id,
        'client_project_name' => 'Warehouse Project',
        'nature_similarity' => 'Steel reinforcement',
        'contract_value' => 3_500_000,
        'contract_date' => now()->subYears(3),
    ]);

    $ineligibleSupplier = Supplier::create([
        'user_id' => $user->id,
        'status' => 'approved',
        'legal_name' => 'Expired Tax PLC',
        'trade_name' => 'Expired Tax',
        'procurement_type' => 'supply',
        'primary_business_category' => 'Construction Materials',
        'sub_category' => 'Steel & Reinforcement',
        'registered_capital' => 15_000_000,
        'trade_license_renewed_date' => now()->addYear(),
        'tax_clearance_expiry' => now()->subDay(),
        'subject_to_excise_tax' => true,
        'authorized_manufacturer_distributor' => true,
        'date_established' => now()->subYears(8)->toDateString(),
        'latest_annual_turnover' => 30_000_000,
    ]);

    createSupplierMatchingDocuments($eligibleSupplier);
    createSupplierMatchingDocuments($ineligibleSupplier);

    SupplierContract::create([
        'supplier_id' => $ineligibleSupplier->id,
        'client_project_name' => 'Government Supply',
        'nature_similarity' => 'Steel reinforcement',
        'contract_value' => 4_000_000,
        'contract_date' => now()->subYears(1),
    ]);

    $request = ProcurementRequest::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'subcategory' => 'Steel & Reinforcement',
        'procurement_type' => 'supply',
        'number_of_suppliers_required' => 5,
        'purpose_notes' => 'Need reinforcement steel for upcoming projects.',
        'minimum_capital' => 10_000_000,
        'require_valid_trade_license' => true,
        'require_tax_clearance' => true,
        'require_excise_tax' => true,
        'require_manufacturer_authorization' => true,
        'minimum_similar_contracts' => 2,
        'look_back_years' => 5,
        'minimum_contract_value' => 2_000_000,
        'minimum_annual_turnover' => 20_000_000,
        'status' => 'submitted',
    ]);

    $service = app(SupplierMatchingService::class);
    $service->runMatching($request);

    $matches = $service->getRankedMatches($request);

    expect($matches)->toHaveCount(2)
        ->and($matches[0]['legal_name'])->toBe('ABC Steel PLC')
        ->and($matches[0]['eligible'])->toBeTrue()
        ->and($matches[0]['match_score'])->toBeGreaterThan(0)
        ->and($matches[1]['legal_name'])->toBe('Expired Tax PLC')
        ->and($matches[1]['eligible'])->toBeFalse();
});

it('keeps a supplier with multiple procurement types eligible and uses the tax clearance range', function () {
    $category = Category::create([
        'name' => 'Construction Materials',
        'slug' => 'construction-materials',
        'type' => 'business',
        'sort_order' => 1,
    ]);

    $user = User::factory()->create();

    $taxClearanceTo = now()->addYear()->toDateString();

    $supplier = Supplier::create([
        'user_id' => $user->id,
        'status' => 'approved',
        'legal_name' => 'Multi Type PLC',
        'trade_name' => 'Multi Type',
        'procurement_type' => 'supply,consulting',
        'primary_business_category' => 'Construction Materials',
        'sub_category' => 'Steel & Reinforcement',
        'registered_capital' => 25_000_000,
        'trade_license_renewed_date' => now()->addYear(),
        'tax_clearance_from' => now()->subMonth()->toDateString(),
        'tax_clearance_to' => $taxClearanceTo,
        'subject_to_excise_tax' => true,
        'authorized_manufacturer_distributor' => true,
        'date_established' => now()->subYears(10)->toDateString(),
        'latest_annual_turnover' => 40_000_000,
    ]);

    createSupplierMatchingDocuments($supplier);

    $request = ProcurementRequest::create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'subcategory' => 'Steel & Reinforcement',
        'procurement_type' => 'supply',
        'number_of_suppliers_required' => 5,
        'purpose_notes' => 'Need reinforcement steel for upcoming projects.',
        'require_valid_trade_license' => true,
        'require_tax_clearance' => true,
        'require_excise_tax' => true,
        'require_manufacturer_authorization' => true,
        'status' => 'submitted',
    ]);

    $service = app(SupplierMatchingService::class);
    $service->runMatching($request);

    $matches = $service->getRankedMatches($request);

    expect($matches)->toHaveCount(1)
        ->and($matches[0]['legal_name'])->toBe('Multi Type PLC')
        ->and($matches[0]['eligible'])->toBeTrue()
        ->and($matches[0]['tax_clearance_expiry']->toDateString())->toBe($taxClearanceTo);
});

it('assesses the submitted business scope and mandatory documents', function () {
    $user = User::factory()->create();

    $matchingSupplier = Supplier::factory()->create([
        'status' => 'approved',
        'procurement_type' => 'consulting',
        'primary_business_category' => 'Consultant',
        'sub_category' => 'Project Management',
        'specialization' => 'Structural Design',
        'trade_license_renewed_date' => today()->toDateString(),
    ]);
    createSupplierMatchingDocuments($matchingSupplier, false);

    $wrongSpecializationSupplier = Supplier::factory()->create([
        'status' => 'approved',
        'procurement_type' => 'consulting',
        'primary_business_category' => 'Consultant',
        'sub_category' => 'Project Management',
        'specialization' => 'Interior Design',
        'trade_license_renewed_date' => now()->addYear()->toDateString(),
    ]);
    createSupplierMatchingDocuments($wrongSpecializationSupplier, false);

    $missingDocumentSupplier = Supplier::factory()->create([
        'status' => 'approved',
        'procurement_type' => 'consulting',
        'primary_business_category' => 'Consultant',
        'sub_category' => 'Project Management',
        'specialization' => 'Structural Design',
        'trade_license_renewed_date' => now()->addYear()->toDateString(),
    ]);
    createSupplierMatchingDocuments($missingDocumentSupplier, false, ['tin_certificate']);

    $request = ProcurementRequest::create([
        'user_id' => $user->id,
        'primary_business_category' => 'Consultant',
        'subcategory' => 'Project Management',
        'specialization' => 'Structural Design',
        'procurement_type' => 'consulting',
        'procurement_method' => 'rfp',
        'number_of_suppliers_required' => 1,
        'status' => 'submitted',
    ]);

    $service = app(SupplierMatchingService::class);
    $matches = collect($service->runMatching($request))->keyBy('id');

    expect($matches[$matchingSupplier->id]['eligible'])->toBeTrue()
        ->and($matches[$wrongSpecializationSupplier->id]['eligible'])->toBeFalse()
        ->and($matches[$wrongSpecializationSupplier->id]['eligibility_reasons'])->toContain('Specialization mismatch. Requested: Structural Design, Supplier: Interior Design.')
        ->and($matches[$missingDocumentSupplier->id]['eligible'])->toBeFalse()
        ->and($matches[$missingDocumentSupplier->id]['eligibility_reasons'])->toContain('Required TIN Certificate document is missing or not accepted.')
        ->and($matches[$wrongSpecializationSupplier->id]['match_breakdown']['sub_category']['details'])->toContain('Specialization mismatch. Requested: Structural Design; supplier: Interior Design.');
});

it('applies contract count and value thresholds when no look-back period was submitted', function () {
    $user = User::factory()->create();
    $supplier = Supplier::factory()->create([
        'status' => 'approved',
        'procurement_type' => 'service',
        'trade_license_renewed_date' => now()->addYear()->toDateString(),
    ]);
    createSupplierMatchingDocuments($supplier, false);

    SupplierContract::factory()->create([
        'supplier_id' => $supplier->id,
        'contract_value' => 3_000_000,
        'contract_date' => now()->subYears(8)->toDateString(),
    ]);

    $request = ProcurementRequest::create([
        'user_id' => $user->id,
        'procurement_type' => 'service',
        'number_of_suppliers_required' => 1,
        'minimum_similar_contracts' => 2,
        'minimum_contract_value' => 2_000_000,
        'status' => 'submitted',
    ]);

    $match = app(SupplierMatchingService::class)->runMatching($request)[0];

    expect($match['eligible'])->toBeFalse()
        ->and($match['eligibility_reasons'])->toContain('Insufficient similar contracts. Required: 2, Found: 1.')
        ->and($match['match_breakdown']['experience']['details'])->toContain('1 qualifying contracts; 2 required.');
});
