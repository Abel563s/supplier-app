<?php

use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the grade tab with the supplier procurement types and saved grades', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create([
        'procurement_type' => 'supply,consulting',
        'procurement_grades' => [
            'supply' => ['company_profile' => 4],
            'consulting' => ['company_profile' => 3],
        ],
    ]);

    $this->actingAs($admin)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/suppliers/show')
            ->where('supplier.procurement_type_list', ['supply', 'consulting'])
            ->where('supplier.procurement_grades.supply.company_profile', 4)
            ->where('supplier.procurement_grades.consulting.company_profile', 3)
        );
});

it('saves separate grades for each selected procurement type', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create(['procurement_type' => 'supply,service']);

    $grades = [
        'supply' => [
            'company_profile' => 5,
            'organizational_structure' => 2,
            'address' => 4,
            'product_list' => 3,
            'legal_document' => 4,
        ],
        'service' => [
            'company_profile' => 4,
            'organizational_structure' => 3,
            'address' => 3,
            'product_list' => 4,
            'legal_document' => 2,
        ],
    ];

    $response = $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => $grades,
    ]);

    $response->assertRedirectToRoute('suppliers.show', $supplier);

    $this->actingAs($admin)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.success', 'Supplier grades saved successfully.')
        );

    expect($supplier->refresh()->procurement_grades)->toBe([
        'supply' => [
            'company_profile' => 5,
            'organizational_structure' => 2,
            'address' => 4,
            'product_list' => 3,
            'legal_document' => 4,
        ],
        'service' => [
            'company_profile' => 4,
            'organizational_structure' => 3,
            'address' => 3,
            'product_list' => 4,
            'legal_document' => 2,
        ],
    ]);
});

it('rejects scores above a criterion maximum without changing saved grades', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create([
        'procurement_type' => 'supply',
        'procurement_grades' => ['supply' => ['company_profile' => 2]],
    ]);

    $response = $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => [
            'supply' => [
                'company_profile' => 6,
                'organizational_structure' => 3,
                'address' => 4,
                'product_list' => 4,
                'legal_document' => 4,
            ],
        ],
    ]);

    $response->assertSessionHasErrors('grades.supply.company_profile');

    expect($supplier->refresh()->procurement_grades)->toBe(['supply' => ['company_profile' => 2]]);
});

it('requires a score for every criterion before saving grades', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create(['procurement_type' => 'supply']);

    $response = $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => [
            'supply' => [
                'company_profile' => 5,
                'organizational_structure' => 3,
                'address' => 4,
                'legal_document' => 4,
            ],
        ],
    ]);

    $response->assertSessionHasErrors('grades.supply.product_list');

    expect($supplier->refresh()->procurement_grades)->toBeNull();
});

it('does not allow an admin to grade a procurement type the supplier does not offer', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create(['procurement_type' => 'supply']);

    $response = $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => [
            'supply' => [
                'company_profile' => 5,
                'organizational_structure' => 3,
                'address' => 4,
                'product_list' => 4,
                'legal_document' => 4,
            ],
            'consulting' => [
                'company_profile' => 5,
                'organizational_structure' => 3,
                'address' => 4,
                'product_list' => 4,
                'legal_document' => 4,
            ],
        ],
    ]);

    $response->assertSessionHasErrors('grades');

    expect($supplier->refresh()->procurement_grades)->toBeNull();
});

it('rejects grade submissions when the supplier has no procurement type', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $supplier = Supplier::factory()->create(['procurement_type' => null]);

    $this->actingAs($admin)
        ->post(route('suppliers.grades.store', $supplier), ['grades' => []])
        ->assertUnprocessable();

    expect($supplier->refresh()->procurement_grades)->toBeNull();
});

it('forbids non-admin users from saving supplier grades', function () {
    $supplier = Supplier::factory()->create(['procurement_type' => 'supply']);
    $user = User::factory()->create(['role' => 'supplier']);

    $this->actingAs($user)
        ->post(route('suppliers.grades.store', $supplier), ['grades' => []])
        ->assertForbidden();
});
