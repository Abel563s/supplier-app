<?php

use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

function documentUploadSupplier(): User
{
    $user = User::factory()->create([
        'role' => 'supplier',
    ]);

    Supplier::firstOrCreate(['user_id' => $user->id], ['status' => 'draft']);

    return $user;
}

it('uploads a pdf document', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration.pdf', 120, 'application/pdf'),
        ]);

    $response->assertCreated();

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->documents()->where('document_type', 'business_registration')->exists())->toBeTrue();
});

it('resolves a documents correction only after a valid replacement upload', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();
    $supplier = Supplier::firstWhere('user_id', $user->id);
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier->update([
        'status' => 'needs_correction',
        'submitted_at' => now(),
    ]);
    $correctionRequest = $supplier->correctionRequests()->create([
        'requested_by' => $admin->id,
        'section' => 'documents',
        'reason' => 'Upload a current business registration.',
    ]);

    $this->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration.jpg', 120, 'image/jpeg'),
        ])
        ->assertInvalid('file');

    $this->assertDatabaseHas('correction_requests', [
        'id' => $correctionRequest->id,
        'resolved_at' => null,
    ]);

    $this->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration.pdf', 120, 'application/pdf'),
        ])
        ->assertCreated();

    $this->assertDatabaseHas('correction_requests', [
        'id' => $correctionRequest->id,
        'resolved_by' => $user->id,
    ]);
    expect($supplier->fresh()->status)->toBe('submitted');
});

it('uploads the newly supported document types', function (string $documentType) {
    Storage::fake('public');

    $user = documentUploadSupplier();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => $documentType,
            'file' => UploadedFile::fake()->create($documentType.'.pdf', 120, 'application/pdf'),
        ]);

    $response->assertCreated();

    $supplier = Supplier::firstWhere('user_id', $user->id);

    expect($supplier->documents()->where('document_type', $documentType)->exists())->toBeTrue();
})->with(['egp_registration_letter', 'hse_commitment_letter', 'testimonials', 'vat_certificate']);

it('allows suppliers to remove their documents before submission', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();
    $supplier = Supplier::firstWhere('user_id', $user->id);
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

    $response = $this->actingAs($user)->deleteJson("/supplier/registration/documents/{$document->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('supplier_documents', ['id' => $document->id]);
    Storage::disk('public')->assertMissing($path);
});

it('forbids suppliers from removing documents after submission', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();
    $supplier = Supplier::firstWhere('user_id', $user->id);
    $supplier->update(['submitted_at' => now()]);

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

    $response = $this->actingAs($user)->deleteJson("/supplier/registration/documents/{$document->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('supplier_documents', ['id' => $document->id]);
    Storage::disk('public')->assertExists($path);
});

it('rejects a document that is not a pdf', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => 'business_registration',
            'file' => UploadedFile::fake()->create('registration.jpg', 120, 'image/jpeg'),
        ]);

    $response->assertInvalid('file');
});

it('rejects an unsupported document type', function () {
    Storage::fake('public');

    $user = documentUploadSupplier();

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/documents/upload', [
            'document_type' => 'tax_pin',
            'file' => UploadedFile::fake()->create('tax-pin.pdf', 120, 'application/pdf'),
        ]);

    $response->assertInvalid('document_type');
});

it('requires the remaining required documents before submitting the registration', function () {
    $user = documentUploadSupplier();

    $supplier = Supplier::firstWhere('user_id', $user->id);

    foreach (['business_registration', 'business_license', 'tin_certificate', 'tax_clearance_certificate'] as $documentType) {
        $supplier->documents()->create([
            'document_type' => $documentType,
            'file_name' => $documentType.'.pdf',
            'file_path' => 'supplier-documents/'.$documentType.'.pdf',
            'file_size' => 1000,
            'file_type' => 'pdf',
            'uploaded_at' => now(),
        ]);
    }

    $response = $this
        ->actingAs($user)
        ->post('/supplier/registration/submit', [
            'declaration_confirmed' => true,
        ]);

    $response->assertInvalid([
        'documents' => 'The following required documents are missing: vat_certificate, egp_registration_letter, hse_commitment_letter.',
    ]);

    foreach (['vat_certificate', 'egp_registration_letter', 'hse_commitment_letter'] as $documentType) {
        $supplier->documents()->create([
            'document_type' => $documentType,
            'file_name' => $documentType.'.pdf',
            'file_path' => 'supplier-documents/'.$documentType.'.pdf',
            'file_size' => 1000,
            'file_type' => 'pdf',
            'uploaded_at' => now(),
        ]);
    }

    $this
        ->actingAs($user)
        ->post('/supplier/registration/submit', [
            'declaration_confirmed' => true,
        ])
        ->assertRedirectToRoute('supplier.registration.submitted');
});

it('marks the documents step complete once the required documents are uploaded', function () {
    $user = documentUploadSupplier();

    $supplier = Supplier::firstWhere('user_id', $user->id);

    foreach (SupplierDocument::REQUIRED_TYPES as $documentType) {
        $supplier->documents()->create([
            'document_type' => $documentType,
            'file_name' => $documentType.'.pdf',
            'file_path' => 'supplier-documents/'.$documentType.'.pdf',
            'file_size' => 1000,
            'file_type' => 'pdf',
            'uploaded_at' => now(),
        ]);
    }

    $response = $this->actingAs($user)->get('/supplier');

    $response->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completion.steps.5.status', 'complete')
        );
});
