<?php

use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function supplierRegistrationUser(): User
{
    $user = User::factory()->create([
        'role' => 'supplier',
    ]);

    Supplier::firstOrCreate(['user_id' => $user->id], ['status' => 'draft']);

    return $user;
}

it('submits the registration from the declarations step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/declarations', [
            'declaration_confirmed' => true,
        ]);

    $response->assertRedirectToRoute('supplier.registration.submitted');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->status)->toBe('submitted')
        ->and($supplier->declaration_confirmed)->toBeTrue();
});

it('shows active correction requests and resolves only the section the supplier updates', function () {
    $supplier = Supplier::factory()->submitted()->create([
        'status' => 'submitted',
        'approval_stage' => 'admin_review',
    ]);
    $admin = User::factory()->create(['role' => 'admin']);
    $user = $supplier->user;

    $this->actingAs($admin)
        ->post(route('suppliers.correction-request.send', $supplier), [
            'section' => 'legal_entity',
            'reason' => 'Update the registered legal name.',
        ])
        ->assertRedirect();

    $this->actingAs($admin)
        ->post(route('suppliers.correction-request.send', $supplier), [
            'section' => 'contact',
            'reason' => 'Confirm the primary contact details.',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->get(route('supplier.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('supplierStatus', 'needs_correction')
            ->has('correctionRequests', 2)
            ->where('correctionRequests.0.reason', 'Confirm the primary contact details.')
            ->where('correctionRequests.1.reason', 'Update the registered legal name.')
        );

    $this->actingAs($user)
        ->post(route('supplier.registration.legal-entity.store'), [])
        ->assertInvalid(['legal_name', 'tin']);

    $this->actingAs($user)
        ->get(route('supplier.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('correctionRequests', 2));

    $this->actingAs($user)
        ->post(route('supplier.registration.legal-entity.store'), [
            'legal_form' => 'PLC',
            'country_of_registration' => 'Ethiopia',
            'legal_name' => 'Updated Example PLC',
            'tin' => '0012345678',
            'business_registration_no' => 'BRN/123/2024',
            'registered_capital' => 1000000,
            'latest_annual_turnover' => 5000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
            'tax_clearance_from' => '2025-07-01',
            'tax_clearance_to' => '2026-06-30',
        ])
        ->assertRedirectToRoute('supplier.registration.contact');

    $this->actingAs($user)
        ->get(route('supplier.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('supplierStatus', 'needs_correction')
            ->has('correctionRequests', 1)
            ->where('correctionRequests.0.section', 'contact')
            ->where('correctionRequests.0.reason', 'Confirm the primary contact details.')
        );

    $this->assertDatabaseHas('correction_requests', [
        'supplier_id' => $supplier->id,
        'section' => 'legal_entity',
        'resolved_by' => $user->id,
    ]);
    $this->assertDatabaseHas('correction_requests', [
        'supplier_id' => $supplier->id,
        'section' => 'contact',
        'resolved_at' => null,
    ]);

    $this->actingAs($user)
        ->post(route('supplier.registration.contact.store'), [
            'primary_contact_name' => 'Abebe Kebede',
            'primary_phone' => '+251 911 234 567',
            'alternate_phone' => '+251 911 234 568',
            'primary_email' => 'abebe@example.com',
            'city' => 'Addis Ababa',
            'subcity' => 'Bole',
            'woreda' => '03',
        ])
        ->assertRedirectToRoute('supplier.registration.business-scope');

    $this->actingAs($user)
        ->get(route('supplier.dashboard'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('supplierStatus', 'submitted')
            ->has('correctionRequests', 0)
        );

    $this->assertDatabaseHas('correction_requests', [
        'supplier_id' => $supplier->id,
        'section' => 'contact',
        'resolved_by' => $user->id,
    ]);
    $this->assertDatabaseHas('supplier_status_histories', [
        'supplier_id' => $supplier->id,
        'previous_status' => 'needs_correction',
        'new_status' => 'submitted',
        'changed_by' => $user->id,
    ]);
});

it('stores contact details from the contact step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/contact', [
            'primary_contact_name' => 'Abebe Kebede',
            'primary_phone' => '+251 911 234 567',
            'alternate_phone' => '+251 911 234 568',
            'primary_email' => 'abebe@example.com',
            'city' => 'Addis Ababa',
            'subcity' => 'Bole',
            'woreda' => '03',
        ]);

    $response->assertRedirectToRoute('supplier.registration.business-scope');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->primary_contact_name)->toBe('Abebe Kebede')
        ->and($supplier->primary_phone)->toBe('+251 911 234 567')
        ->and($supplier->city)->toBe('Addis Ababa')
        ->and($supplier->woreda)->toBe('03');
});

it('requires the subcity in the contact step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/contact', [
            'primary_contact_name' => 'Abebe Kebede',
            'primary_phone' => '+251 911 234 567',
            'primary_email' => 'abebe@example.com',
            'city' => 'Addis Ababa',
            'woreda' => '03',
        ]);

    $response->assertInvalid(['subcity' => 'Subcity is required']);
});

it('requires the tax clearance range in the legal entity step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/legal-entity', [
            'legal_form' => 'PLC',
            'country_of_registration' => 'Ethiopia',
            'legal_name' => 'Example PLC',
            'tin' => '0012345678',
            'business_registration_no' => 'BRN/123/2024',
            'registered_capital' => 1000000,
            'latest_annual_turnover' => 5000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
        ]);

    $response->assertInvalid([
        'tax_clearance_from' => 'Tax Clearance From is required',
        'tax_clearance_to' => 'Tax Clearance To is required',
    ]);
});

it('stores a legal form entered through the other option', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/legal-entity', [
            'legal_form' => 'Joint Venture',
            'country_of_registration' => 'Kenya',
            'legal_name' => 'Example PLC',
            'tin' => '0012345678',
            'business_registration_no' => 'BRN/123/2024',
            'registered_capital' => 1000000,
            'latest_annual_turnover' => 5000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
            'tax_clearance_from' => '2025-07-01',
            'tax_clearance_to' => '2026-06-30',
        ]);

    $response->assertRedirectToRoute('supplier.registration.contact');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->legal_form)->toBe('Joint Venture')
        ->and($supplier->country_of_registration)->toBe('Kenya');
});

it('stores signatory details from the ownership step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/ownership', [
            'signatory_title' => 'General Manager',
            'owner_ceo_name' => 'Abebe Kebede',
        ]);

    $response->assertRedirectToRoute('supplier.registration.documents');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->signatory_title)->toBe('General Manager')
        ->and($supplier->owner_ceo_name)->toBe('Abebe Kebede');
});

it('stores the tax clearance range from the legal entity step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/legal-entity', [
            'legal_form' => 'PLC',
            'country_of_registration' => 'Ethiopia',
            'legal_name' => 'Example PLC',
            'trade_name' => 'Example',
            'tin' => '0012345678',
            'business_registration_no' => 'BRN/123/2024',
            'vat_registered' => true,
            'vat_registration_no' => 'VAT0098765',
            'registered_capital' => 1000000,
            'latest_annual_turnover' => 5000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
            'tax_clearance_from' => '2025-07-01',
            'tax_clearance_to' => '2026-06-30',
            'tax_clearance_fiscal_year' => '2017 E.C.',
        ]);

    $response->assertRedirectToRoute('supplier.registration.contact');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->country_of_registration)->toBe('Ethiopia')
        ->and($supplier->tax_clearance_from->toDateString())->toBe('2025-07-01')
        ->and($supplier->tax_clearance_to->toDateString())->toBe('2026-06-30')
        ->and($supplier->tax_clearance_fiscal_year)->toBe('2017 E.C.');
});

it('stores a country of registration entered through the other option', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/legal-entity', [
            'legal_form' => 'PLC',
            'country_of_registration' => 'Kenya',
            'legal_name' => 'Example PLC',
            'tin' => '0012345678',
            'business_registration_no' => 'BRN/123/2024',
            'registered_capital' => 1000000,
            'latest_annual_turnover' => 5000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
            'tax_clearance_from' => '2025-07-01',
            'tax_clearance_to' => '2026-06-30',
        ]);

    $response->assertRedirectToRoute('supplier.registration.contact');

    expect(Supplier::firstWhere('user_id', $user->id)->country_of_registration)->toBe('Kenya');
});

it('stores personnel counts from the bank and financial step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/bank-financial', [
            'bank_name' => 'Commercial Bank of Ethiopia',
            'number_of_employees' => 120,
            'technical_personnel' => 45,
            'non_technical_personnel' => 75,
        ]);

    $response->assertRedirectToRoute('supplier.registration.ownership');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->technical_personnel)->toBe(45)
        ->and($supplier->non_technical_personnel)->toBe(75);
});

it('stores multiple procurement types from the business scope step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'procurement_type' => ['supply', 'consulting'],
            'primary_business_category' => 'Office Facilities',
            'sub_category' => 'Office Material',
            'specialization' => 'Interior Fit-out',
            'products_services_description' => 'Office material supply.',
        ]);

    $response->assertRedirectToRoute('supplier.registration.bank-financial');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->procurement_type)->toBe('supply,consulting')
        ->and($supplier->primary_business_category)->toBe('Office Facilities')
        ->and($supplier->sub_category)->toBe('Office Material')
        ->and($supplier->specialization)->toBe('Interior Fit-out');
});

it('accepts a single procurement type submitted as a string', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'procurement_type' => 'service',
            'primary_business_category' => 'Cleaning and Security',
            'sub_category' => 'Cleaning',
            'specialization' => 'Service Provider',
            'products_services_description' => 'Cleaning services.',
        ]);

    $response->assertRedirectToRoute('supplier.registration.bank-financial');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->procurement_type)->toBe('service');
});

it('expands a legacy procurement type into supported types', function () {
    $user = supplierRegistrationUser();

    Supplier::firstWhere('user_id', $user->id)->update(['procurement_type' => 'both']);

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'procurement_type' => ['both'],
            'primary_business_category' => 'Office Facilities',
            'sub_category' => 'Office Material',
            'specialization' => 'Furniture & Fixtures',
            'products_services_description' => 'Office material supply.',
        ]);

    $response->assertRedirectToRoute('supplier.registration.bank-financial');

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->procurement_type)->toBe('supply,service');
});

it('rejects an unsupported procurement type in the business scope step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'procurement_type' => ['licensing'],
            'primary_business_category' => 'Office Facilities',
            'sub_category' => 'Office Material',
            'products_services_description' => 'Office material supply.',
        ]);

    $response->assertInvalid(['procurement_type.0' => 'Selected Procurement Type is invalid']);
});

it('prefills legacy procurement types on the business scope step', function () {
    $user = supplierRegistrationUser();

    Supplier::firstWhere('user_id', $user->id)->update(['procurement_type' => 'both']);

    $response = $this
        ->actingAs($user)
        ->get('/supplier/registration/business-scope');

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('supplier/registration/business-scope')
            ->where('supplier.procurement_type_list', ['supply', 'service'])
        );
});

it('requires the specialization in the business scope step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'procurement_type' => ['supply'],
            'primary_business_category' => 'Office Facilities',
            'sub_category' => 'Office Material',
            'products_services_description' => 'Office material supply.',
        ]);

    $response->assertInvalid(['specialization' => 'Specialization is required']);
});

it('requires the alternate contact number in the contact step', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/contact', [
            'primary_contact_name' => 'Abebe Kebede',
            'primary_phone' => '+251 911 234 567',
            'primary_email' => 'abebe@example.com',
            'city' => 'Addis Ababa',
            'subcity' => 'Bole',
            'woreda' => '03',
        ]);

    $response->assertInvalid(['alternate_phone' => 'Alternate / Sales Contact Number is required']);
});

it('rejects the business scope step when required fields are missing', function () {
    $user = supplierRegistrationUser();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/business-scope', [
            'specialization' => 'Interior Fit-out',
        ]);

    $response->assertInvalid([
        'procurement_type',
        'primary_business_category',
        'sub_category',
        'products_services_description',
    ]);
});
