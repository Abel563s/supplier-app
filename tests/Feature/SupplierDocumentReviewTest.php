<?php

use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function supplierWithDocument(string $documentType): Supplier
{
    $supplier = Supplier::factory()->create();

    $supplier->documents()->create([
        'document_type' => $documentType,
        'file_name' => $documentType.'.pdf',
        'file_path' => 'supplier-documents/'.$documentType.'.pdf',
        'file_size' => 1000,
        'file_type' => 'pdf',
        'uploaded_at' => now(),
    ]);

    return $supplier;
}

it('lists every document type on the admin supplier page for review', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierWithDocument('business_registration');
    $latestDocument = $supplier->documents()->create([
        'document_type' => 'business_registration',
        'file_name' => 'latest-registration.pdf',
        'file_path' => 'supplier-documents/latest-registration.pdf',
        'file_size' => 1200,
        'file_type' => 'pdf',
        'uploaded_at' => now(),
    ]);

    $response = $this->actingAs($admin)->get(route('suppliers.show', $supplier));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/show')
            ->has('documentTypes', count(SupplierDocument::TYPES))
            ->where('documentTypes.0.key', SupplierDocument::TYPES[0])
            ->where('documentTypes.0.label', SupplierDocument::LABELS[SupplierDocument::TYPES[0]])
            ->has('documents', 2)
            ->where('documents.0.id', $latestDocument->id)
        );
});

it('marks the required document types in the admin catalogue', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = supplierWithDocument('vat_certificate');

    $this->actingAs($admin)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(function (Assert $page) {
            foreach (SupplierDocument::catalog() as $index => $documentType) {
                $page
                    ->where("documentTypes.$index.key", $documentType['key'])
                    ->where("documentTypes.$index.required", $documentType['required']);
            }

            return $page;
        });
});

it('sends the document catalogue to the registration documents step', function () {
    $user = User::factory()->create(['role' => 'supplier']);

    $supplier = Supplier::firstOrCreate(['user_id' => $user->id], ['status' => 'draft']);

    $this->actingAs($user)
        ->get(route('supplier.registration.documents'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('supplier/registration/documents')
            ->where('canRemoveDocuments', true)
            ->has('documentTypes', count(SupplierDocument::TYPES))
            ->where('documentTypes.4.key', 'vat_certificate')
            ->where('documentTypes.4.required', true)
            ->has('documents', $supplier->documents()->count())
        );
});

it('marks supplier documents as locked after registration submission', function () {
    $user = User::factory()->create(['role' => 'supplier']);
    $supplier = Supplier::factory()->create([
        'user_id' => $user->id,
        'status' => 'submitted',
        'submitted_at' => now(),
    ]);

    $this->actingAs($user)
        ->get(route('supplier.registration.documents'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canRemoveDocuments', false)
            ->has('documents', $supplier->documents()->count())
        );
});
