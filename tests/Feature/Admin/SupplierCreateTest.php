<?php

use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function supplierRegistrationDetails(array $overrides = []): array
{
    return array_merge([
        'legal_form' => 'PLC',
        'country_of_registration' => 'Ethiopia',
        'legal_name' => 'New Supplier PLC',
        'trade_name' => 'New Supplier',
        'tin' => '1234567890',
        'business_registration_no' => 'BRN/123/2026',
        'vat_registered' => false,
        'registered_capital' => 1000000,
        'latest_annual_turnover' => 5000000,
        'date_established' => '2015-04-01',
        'trade_license_renewed_date' => '2026-06-30',
        'primary_contact_name' => 'Abebe Kebede',
        'primary_phone' => '+251911000000',
        'alternate_phone' => '+251911000001',
        'primary_email' => 'new-supplier@example.com',
        'city' => 'Addis Ababa',
        'subcity' => 'Bole',
        'woreda' => '03',
        'procurement_type' => ['supply', 'consulting'],
        'primary_business_category' => 'Office Facilities',
        'sub_category' => 'Office Material',
        'specialization' => 'Wholesaler / Distributor',
        'products_services_description' => 'Office supplies and equipment.',
        'tax_clearance_from' => '2025-07-01',
        'tax_clearance_to' => '2026-06-30',
        'signatory_title' => 'General Manager',
        'owner_ceo_name' => 'Abebe Kebede',
    ], $overrides);
}

it('renders the admin supplier registration form', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->get(route('suppliers.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/create')
            ->has('completion.steps', 7)
            ->has('documentTypes', count(SupplierDocument::TYPES))
        );
});

it('creates a supplier account and registration from the admin form', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('suppliers.store'), supplierRegistrationDetails([
        'declaration_confirmed' => true,
    ]));

    $response->assertRedirectToRoute('suppliers.edit', Supplier::firstWhere('legal_name', 'New Supplier PLC'));

    $user = User::where('email', 'new-supplier@example.com')->firstOrFail();
    $supplier = Supplier::where('user_id', $user->id)->firstOrFail();

    expect($user->name)->toBe('Abebe Kebede')
        ->and($user->role)->toBe('supplier')
        ->and($supplier->legal_name)->toBe('New Supplier PLC')
        ->and($supplier->tin)->toBe('1234567890')
        ->and($supplier->primary_email)->toBe('new-supplier@example.com')
        ->and($supplier->procurement_type)->toBe('supply,consulting')
        ->and($supplier->status)->toBe('submitted')
        ->and($supplier->declaration_confirmed)->toBeTrue();
});

it('keeps an admin-created supplier as a draft without declaration confirmation', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)->post(route('suppliers.store'), supplierRegistrationDetails());

    $supplier = Supplier::where('legal_name', 'New Supplier PLC')->firstOrFail();

    expect($supplier->status)->toBe('draft')
        ->and($supplier->submitted_at)->toBeNull()
        ->and($supplier->declaration_confirmed)->toBeFalse();
});

it('rejects an email already assigned to a user without creating a supplier', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->create(['email' => 'new-supplier@example.com']);
    $userCount = User::count();
    $supplierCount = Supplier::count();

    $response = $this->actingAs($admin)->post(route('suppliers.store'), supplierRegistrationDetails());

    $response->assertInvalid([
        'primary_email' => 'A user account already exists for this email address.',
    ]);

    expect(User::count())->toBe($userCount)
        ->and(Supplier::count())->toBe($supplierCount);
});

it('requires a TIN before creating a supplier', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $userCount = User::count();
    $supplierCount = Supplier::count();

    $response = $this->actingAs($admin)->post(route('suppliers.store'), supplierRegistrationDetails([
        'tin' => '',
    ]));

    $response->assertInvalid(['tin' => 'TIN is required']);

    expect(User::count())->toBe($userCount)
        ->and(Supplier::count())->toBe($supplierCount);
});

it('forbids supplier users from accessing the admin registration form', function () {
    $supplier = User::factory()->create(['role' => 'supplier']);

    $this->actingAs($supplier)
        ->get(route('suppliers.create'))
        ->assertForbidden();
});
