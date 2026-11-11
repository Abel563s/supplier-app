<?php

use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

function supplierEditRecord(): Supplier
{
    return Supplier::factory()->create([
        'legal_form' => 'PLC',
        'country_of_registration' => 'Ethiopia',
        'legal_name' => 'Edit Me PLC',
        'primary_phone' => '+251911000000',
        'alternate_phone' => '+251911000001',
        'subcity' => 'Bole',
        'specialization' => 'Retailer',
        'tax_clearance_from' => '2025-07-01',
        'tax_clearance_to' => '2026-06-30',
        'signatory_title' => 'General Manager',
        'owner_ceo_name' => 'Abebe Kebede',
    ]);
}

it('renders the supplier edit page for an admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $response = $this->actingAs($admin)->get(route('suppliers.edit', $supplier));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/edit')
            ->where('supplier.id', $supplier->id)
            ->where('supplier.legal_name', 'Edit Me PLC')
            ->has('completion.steps', 7)
            ->has('documentTypes', count(SupplierDocument::TYPES))
            ->where('declarationConfirmed', false)
        );
});

it('updates a supplier registration details', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $response = $this
        ->actingAs($admin)
        ->put(route('suppliers.update', $supplier), [
            'legal_form' => 'Share Company',
            'country_of_registration' => 'Kenya',
            'legal_name' => 'Updated Legal Name PLC',
            'trade_name' => 'Updated Trading Name',
            'business_registration_no' => 'BRN/1/2024',
            'vat_registered' => true,
            'vat_registration_no' => 'VAT123',
            'registered_capital' => 2000000,
            'latest_annual_turnover' => 9000000,
            'date_established' => '2015-04-01',
            'trade_license_renewed_date' => '2026-06-30',
            'primary_contact_name' => 'Kebede Abebe',
            'primary_phone' => '+251911222333',
            'alternate_phone' => '+251911444555',
            'primary_email' => 'updated@example.com',
            'city' => 'Addis Ababa',
            'subcity' => 'Kirkos',
            'woreda' => '07',
            'procurement_type' => ['supply', 'consulting'],
            'primary_business_category' => 'Office Facilities',
            'sub_category' => 'A1 — Office Material',
            'specialization' => 'Wholesaler / Distributor',
            'products_services_description' => 'Updated description.',
            'number_of_employees' => 40,
            'technical_personnel' => 15,
            'non_technical_personnel' => 25,
            'tax_clearance_from' => '2025-07-01',
            'tax_clearance_to' => '2026-06-30',
            'signatory_title' => 'Managing Director',
            'owner_ceo_name' => 'Helen Tesfaye',
        ]);

    $response->assertRedirectToRoute('suppliers.show', $supplier);

    $supplier->refresh();

    expect($supplier->legal_form)->toBe('Share Company')
        ->and($supplier->country_of_registration)->toBe('Kenya')
        ->and($supplier->legal_name)->toBe('Updated Legal Name PLC')
        ->and($supplier->subcity)->toBe('Kirkos')
        ->and($supplier->procurement_type)->toBe('supply,consulting')
        ->and($supplier->sub_category)->toBe('A1 — Office Material')
        ->and($supplier->specialization)->toBe('Wholesaler / Distributor')
        ->and($supplier->technical_personnel)->toBe(15)
        ->and($supplier->non_technical_personnel)->toBe(25)
        ->and($supplier->signatory_title)->toBe('Managing Director');
});

it('validates the supplier details updated by an admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $response = $this
        ->actingAs($admin)
        ->put(route('suppliers.update', $supplier), [
            'legal_form' => '',
            'procurement_type' => [],
            'specialization' => '',
            'alternate_phone' => '',
        ]);

    $response->assertInvalid([
        'legal_form',
        'procurement_type',
        'specialization',
        'alternate_phone',
    ]);
});

it('uploads a supplier document for the admin', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $response = $this
        ->actingAs($admin)
        ->post(route('suppliers.documents.upload', $supplier), [
            'document_type' => 'hse_commitment_letter',
            'file' => UploadedFile::fake()->create('hse.pdf', 120, 'application/pdf'),
        ]);

    $response->assertCreated();

    expect($supplier->documents()->where('document_type', 'hse_commitment_letter')->exists())->toBeTrue();
});

it('keeps previous uploads when an admin uploads another document of the same type', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $this->actingAs($admin)
        ->post(route('suppliers.documents.upload', $supplier), [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration-old.pdf', 120, 'application/pdf'),
        ])
        ->assertCreated();

    $this->actingAs($admin)
        ->post(route('suppliers.documents.upload', $supplier), [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration-new.pdf', 140, 'application/pdf'),
        ])
        ->assertCreated();

    $documents = $supplier->documents()->where('document_type', 'business_registration')->get();

    expect($documents)->toHaveCount(2);
    Storage::disk('public')->assertExists($documents[0]->file_path);
    Storage::disk('public')->assertExists($documents[1]->file_path);
});

it('allows an admin to delete a specific supplier document upload', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();
    $path = 'supplier-documents/registration.pdf';
    Storage::disk('public')->put($path, 'document');
    $document = $supplier->documents()->create([
        'document_type' => 'business_registration',
        'file_name' => 'registration.pdf',
        'file_path' => $path,
        'file_size' => 1000,
        'file_type' => 'pdf',
        'uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)->delete(route('suppliers.documents.destroy', [
        'supplier' => $supplier->id,
        'document' => $document->id,
    ]));

    $response->assertRedirect();
    $this->assertDatabaseMissing('supplier_documents', ['id' => $document->id]);
    Storage::disk('public')->assertMissing($path);
});

it('forbids suppliers from deleting documents through the admin endpoint', function () {
    Storage::fake('public');

    $supplierUser = User::factory()->create(['role' => 'supplier']);
    $supplier = Supplier::factory()->create(['user_id' => $supplierUser->id]);
    $document = $supplier->documents()->create([
        'document_type' => 'business_registration',
        'file_name' => 'registration.pdf',
        'file_path' => 'supplier-documents/registration.pdf',
        'file_size' => 1000,
        'file_type' => 'pdf',
        'uploaded_at' => now(),
    ]);

    $response = $this->actingAs($supplierUser)->delete(route('suppliers.documents.destroy', [
        'supplier' => $supplier->id,
        'document' => $document->id,
    ]));

    $response->assertForbidden();
    $this->assertDatabaseHas('supplier_documents', ['id' => $document->id]);
});

it('rejects a supplier document that is not a pdf for the admin', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierEditRecord();

    $response = $this
        ->actingAs($admin)
        ->post(route('suppliers.documents.upload', $supplier), [
            'document_type' => 'testimonials',
            'file' => UploadedFile::fake()->create('testimonials.jpg', 120, 'image/jpeg'),
        ]);

    $response->assertInvalid('file');
});
