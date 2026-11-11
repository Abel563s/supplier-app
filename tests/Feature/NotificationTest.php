<?php

use App\Models\Supplier;
use App\Models\SupplierDocument;
use App\Models\User;
use App\Notifications\SupplierNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function supplyGrades(): array
{
    return [
        'supply' => [
            'company_profile' => 5,
            'organizational_structure' => 3,
            'address' => 4,
            'product_list' => 4,
            'legal_document' => 4,
        ],
    ];
}

function mepGrades(): array
{
    return [
        'supply' => [
            'system_certificate' => 4,
            'product_certificate' => 5,
            'test_report' => 5,
            'product_catalogue' => 6,
        ],
    ];
}

function notificationFor(User $user, string $event, ?int $supplierId = null)
{
    return $user->notifications()
        ->where('type', SupplierNotification::class)
        ->where('data->event', $event)
        ->when($supplierId, fn ($query) => $query->where('data->supplier_id', $supplierId))
        ->get();
}

it('notifies admins and the supplier when a registration is submitted', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create(['status' => 'draft']);

    foreach (SupplierDocument::REQUIRED_TYPES as $type) {
        $supplier->documents()->create([
            'document_type' => $type,
            'file_name' => "{$type}.pdf",
            'file_path' => "supplier-documents/{$type}.pdf",
            'file_size' => 1024,
            'file_type' => 'pdf',
            'uploaded_at' => now(),
        ]);
    }

    $this->actingAs($supplier->user)
        ->post(route('supplier.registration.submit'), [
            'declaration_confirmed' => true,
        ])
        ->assertRedirectToRoute('supplier.registration.submitted');

    expect($supplier->fresh()->status)->toBe('submitted');

    expect(notificationFor($admin, 'supplier_registered', $supplier->id))->toHaveCount(1);
    expect(notificationFor($supplier->user, 'supplier_status_submitted', $supplier->id))->toHaveCount(1);
});

it('notifies only the assigned department when a supplier is assigned for review', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $mep = User::factory()->create(['role' => 'mep']);
    $it = User::factory()->create(['role' => 'it']);

    $supplier = Supplier::factory()->submitted()->create([
        'approval_stage' => 'admin_review',
        'procurement_type' => 'supply',
    ]);

    $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => supplyGrades(),
    ])->assertRedirect();

    $this->actingAs($admin)->post(route('suppliers.approve', $supplier), [
        'departments' => ['mep'],
    ])->assertRedirect();

    expect(notificationFor($mep, 'supplier_assigned', $supplier->id))->toHaveCount(1);
    expect(notificationFor($it, 'supplier_assigned', $supplier->id))->toHaveCount(0);
});

it('notifies admin when a department submits grading', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $mep = User::factory()->create(['role' => 'mep']);

    $supplier = Supplier::factory()->submitted()->create([
        'approval_stage' => 'admin_review',
        'procurement_type' => 'supply',
    ]);

    $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => supplyGrades(),
    ])->assertRedirect();

    $this->actingAs($admin)->post(route('suppliers.approve', $supplier), [
        'departments' => ['mep'],
    ])->assertRedirect();

    $this->actingAs($mep)->post(route('suppliers.departmental-grades.store', $supplier), [
        'grades' => mepGrades(),
    ])->assertRedirect();

    expect(notificationFor($admin, 'department_graded', $supplier->id))->toHaveCount(1);
});

it('notifies admin and approves the supplier when the only department completes its review', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $mep = User::factory()->create(['role' => 'mep']);
    $supplier = Supplier::factory()->submitted()->create([
        'approval_stage' => 'admin_review',
        'procurement_type' => 'supply',
        'user_id' => (User::factory()->create(['role' => 'supplier']))->id,
    ]);

    $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => supplyGrades(),
    ])->assertRedirect();

    $this->actingAs($admin)->post(route('suppliers.approve', $supplier), [
        'departments' => ['mep'],
    ])->assertRedirect();

    $this->actingAs($mep)->post(route('suppliers.departmental-grades.store', $supplier), [
        'grades' => mepGrades(),
    ])->assertRedirect();

    $this->actingAs($mep)->post(route('suppliers.departmental-approve', $supplier))->assertRedirect();

    expect($supplier->fresh()->status)->toBe('approved');

    expect(notificationFor($admin, 'department_approved', $supplier->id))->toHaveCount(1);
    expect(notificationFor($supplier->user, 'supplier_status_approved', $supplier->id))->toHaveCount(1);
});

it('notifies the supplier when additional information is requested', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->submitted()->create([
        'user_id' => (User::factory()->create(['role' => 'supplier']))->id,
    ]);

    $this->actingAs($admin)->post(route('suppliers.correction-request.send', $supplier), [
        'section' => 'legal_entity',
        'reason' => 'Please update the registered legal name.',
    ])->assertRedirect();

    expect($supplier->fresh()->status)->toBe('needs_correction');
    expect(notificationFor($supplier->user, 'supplier_additional_info_requested', $supplier->id))->toHaveCount(1);
});

it('notifies the supplier when the registration is rejected', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->submitted()->create([
        'user_id' => (User::factory()->create(['role' => 'supplier']))->id,
    ]);

    $this->actingAs($admin)->post(route('suppliers.reject', $supplier), [
        'reason' => 'Documentation insufficient.',
    ])->assertRedirect();

    expect($supplier->fresh()->status)->toBe('rejected');
    expect(notificationFor($supplier->user, 'supplier_status_rejected', $supplier->id))->toHaveCount(1);
});

it('tracks unread count and allows marking as read and deleting', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->submitted()->create();

    $user->notify(new SupplierNotification([
        'event' => 'test_notification',
        'category' => 'system_updates',
        'title' => 'Test notification',
        'body' => 'This is a test.',
        'url' => null,
        'supplier_id' => $supplier->id,
        'supplier_name' => 'Test Supplier',
    ]));

    $this->actingAs($user)
        ->get(route('notifications.unread-count'))
        ->assertJson(['count' => 1]);

    $notification = $user->notifications()->first();

    $this->actingAs($user)
        ->patch(route('notifications.read', $notification))
        ->assertJson(['message' => 'Notification marked as read.']);

    expect($notification->fresh()->read_at)->not->toBeNull();

    $this->actingAs($user)
        ->get(route('notifications.unread-count'))
        ->assertJson(['count' => 0]);

    $this->actingAs($user)
        ->patch(route('notifications.read-all'))
        ->assertJson(['message' => 'All notifications marked as read.']);

    $this->actingAs($user)
        ->delete(route('notifications.destroy', $notification))
        ->assertJson(['message' => 'Notification deleted.']);

    expect($user->notifications()->count())->toBe(0);
});

it('does not allow users to access or modify other users notifications', function () {
    $owner = User::factory()->create(['role' => 'admin']);
    $attacker = User::factory()->create(['role' => 'admin']);

    $owner->notify(new SupplierNotification([
        'event' => 'private_notification',
        'category' => 'system_updates',
        'title' => 'Private',
        'body' => 'Private notification.',
        'url' => null,
    ]));

    $notification = $owner->notifications()->where('data->event', 'private_notification')->firstOrFail();

    $this->actingAs($attacker)
        ->patch(route('notifications.read', $notification->id))
        ->assertNotFound();

    $this->actingAs($attacker)
        ->delete(route('notifications.destroy', $notification->id))
        ->assertNotFound();
});
