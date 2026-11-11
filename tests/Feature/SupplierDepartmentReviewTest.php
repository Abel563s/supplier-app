<?php

use App\Models\Role;
use App\Models\Supplier;
use App\Models\SupplierReviewHistory;
use App\Models\User;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;

function validDepartmentGrades(): array
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

function validMepGrades(): array
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

it('lists submitted suppliers but excludes drafts from the admin directory', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $submittedSupplier = Supplier::factory()->submitted()->create([
        'created_at' => '2026-01-01 00:00:00',
        'updated_at' => '2026-01-01 00:00:00',
    ]);
    $pendingSupplier = Supplier::factory()->submitted()->create([
        'status' => 'pending',
        'created_at' => '2026-01-02 00:00:00',
        'updated_at' => '2026-01-02 00:00:00',
    ]);
    Supplier::factory()->create([
        'created_at' => '2026-01-03 00:00:00',
        'updated_at' => '2026-01-03 00:00:00',
    ]);

    $this->actingAs($admin)
        ->get(route('suppliers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.total', 2)
            ->has('suppliers.data', 2)
            ->where('suppliers.data.0.id', $pendingSupplier->id)
            ->where('suppliers.data.0.status', 'pending')
            ->where('suppliers.data.1.id', $submittedSupplier->id)
            ->where('stats.total', 2)
            ->where('stats.submitted', 1)
            ->where('stats.pending', 1)
        );
});

it('provides unique database-backed Admin and department roles', function () {
    $adminRole = Role::query()->where('key', 'admin')->firstOrFail();

    expect($adminRole->name)->toBe('Admin')
        ->and(Role::departments()->pluck('key')->sort()->values()->all())->toEqual(collect(Role::DEPARTMENT_KEYS)->sort()->values()->all())
        ->and(Role::query()->where('key', 'superadmin')->exists())->toBeFalse();

    expect(fn () => Role::create([
        'key' => 'mep',
        'name' => 'Duplicate MEP',
        'type' => Role::DEPARTMENT,
    ]))->toThrow(QueryException::class);
});

it('lists dynamic roles and allows an Admin to assign a department role to a user', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);

    $this->actingAs($admin)
        ->get(route('roles.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('roles.0.key', 'admin')
            ->has('roles', 11)
        );

    $this->actingAs($admin)->post(route('roles.store'), [
        'name' => 'MEP Reviewer',
        'email' => 'mep-reviewer@example.com',
        'password' => 'password-123',
        'password_confirmation' => 'password-123',
        'role' => 'mep',
        'status' => 'active',
    ])->assertRedirect();

    expect(User::query()->where('email', 'mep-reviewer@example.com')->value('role'))->toBe('mep');

    $departmentReviewer = User::factory()->create(['role' => 'mep']);

    $this->actingAs($departmentReviewer)
        ->post(route('roles.store.public'), [
            'name' => 'Unauthorized Admin',
            'email' => 'unauthorized-admin@example.com',
            'password' => 'password-123',
            'password_confirmation' => 'password-123',
            'role' => 'admin',
            'status' => 'active',
        ])
        ->assertForbidden();
});

it('restricts each department listing and supplier page to its assigned department', function () {
    $suppliers = [];

    foreach (Role::departments()->orderBy('key')->get() as $department) {
        $suppliers[$department->key] = Supplier::factory()->submitted()->create([
            'approval_stage' => 'department_review',
        ]);
        $suppliers[$department->key]->departmentReviews()->create([
            'department' => $department->key,
            'status' => 'assigned',
        ]);
    }

    $admin = User::factory()->create(['role' => Role::ADMIN]);

    $this->actingAs($admin)
        ->get(route('suppliers.index'))
        ->assertInertia(fn (Assert $page) => $page->where('isAdmin', true)->where('suppliers.total', 9));

    foreach (Role::departments()->orderBy('key')->get() as $department) {
        $reviewer = User::factory()->create(['role' => $department->key]);
        $ownSupplier = $suppliers[$department->key];

        $this->actingAs($reviewer)
            ->get(route('suppliers.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('isAdmin', false)
                ->where('suppliers.total', 1)
                ->where('suppliers.data.0.id', $ownSupplier->id)
            );

        $this->actingAs($reviewer)
            ->get(route('suppliers.show', $ownSupplier))
            ->assertOk();

        $this->actingAs($reviewer)
            ->get(route('suppliers.documents', $ownSupplier))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('isAdmin', false));

        $this->actingAs($reviewer)
            ->post(route('suppliers.grades.store', $ownSupplier), ['grades' => validDepartmentGrades()])
            ->assertForbidden();

        $this->actingAs($reviewer)
            ->put(route('suppliers.update', $ownSupplier), [])
            ->assertForbidden();

        $this->actingAs($reviewer)
            ->post(route('suppliers.documents.upload', $ownSupplier), [])
            ->assertForbidden();
    }

    $mepReviewer = User::factory()->create(['role' => 'mep']);

    $this->actingAs($mepReviewer)
        ->get(route('suppliers.show', $suppliers['it']))
        ->assertNotFound();

    $this->actingAs($mepReviewer)
        ->get(route('suppliers.documents', $suppliers['it']))
        ->assertNotFound();

    $unassignedSupplier = Supplier::factory()->create();
    $this->actingAs($mepReviewer)
        ->get(route('suppliers.show', $unassignedSupplier))
        ->assertNotFound();

    $this->actingAs($mepReviewer)
        ->get(route('suppliers.edit', $suppliers['mep']))
        ->assertForbidden();
});

it('marks a supplier pending after department assignment', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $supplier = Supplier::factory()->submitted()->create(['procurement_type' => 'supply']);

    $this->actingAs($admin)->post(route('suppliers.grades.store', $supplier), [
        'grades' => validDepartmentGrades(),
    ])->assertRedirectToRoute('suppliers.show', $supplier);

    $this->actingAs($admin)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManageAdminReview', true)
            ->where('isSupplierApproved', false)
            ->where('isDepartmentReview', false)
        );

    $this->actingAs($admin)->post(route('suppliers.approve', $supplier), [
        'departments' => ['mep', 'it'],
    ])->assertRedirect();

    $supplier->refresh();

    expect($supplier->status)->toBe('pending')
        ->and($supplier->approval_department)->toBe('mep')
        ->and($supplier->approval_stage)->toBe('department_review')
        ->and($supplier->department_review_status)->toBe('assigned')
        ->and($supplier->department_assigned_by)->toBe($admin->id)
        ->and($supplier->department_assigned_at)->not->toBeNull()
        ->and($supplier->departmentReviews()->count())->toBe(2);

    $this->assertDatabaseHas('supplier_review_histories', [
        'supplier_id' => $supplier->id,
        'event_type' => 'admin_graded',
        'actor_id' => $admin->id,
    ]);
    $this->assertDatabaseHas('supplier_review_histories', [
        'supplier_id' => $supplier->id,
        'event_type' => 'department_assigned',
        'department' => 'mep',
        'actor_id' => $admin->id,
    ]);
    $this->assertDatabaseHas('supplier_review_histories', [
        'supplier_id' => $supplier->id,
        'event_type' => 'department_assigned',
        'department' => 'it',
        'actor_id' => $admin->id,
    ]);
    $this->assertDatabaseHas('supplier_status_histories', [
        'supplier_id' => $supplier->id,
        'new_status' => 'pending',
    ]);

    $this->actingAs($admin)
        ->get(route('suppliers.index', ['status' => 'pending']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.total', 1)
            ->where('suppliers.data.0.status', 'pending')
            ->where('stats.pending', 1)
        );

    $this->actingAs($admin)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->where('supplier.status', 'pending')
            ->where('supplier.approval_stage', 'department_review')
            ->where('canInitiateHandoff', false)
            ->where('canManageAdminReview', false)
            ->where('isSupplierApproved', false)
            ->where('isDepartmentReview', true)
            ->has('departmentReviews', 2)
        );

    $this->actingAs($admin)->post(route('suppliers.approve', $supplier), [
        'departments' => ['design'],
    ])->assertStatus(409);

    $ungradedSupplier = Supplier::factory()->submitted()->create(['procurement_type' => 'supply']);
    $this->actingAs($admin)->post(route('suppliers.approve', $ungradedSupplier), [
        'departments' => ['mep'],
    ])->assertStatus(422);

    $invalidDepartmentSupplier = Supplier::factory()->submitted()->create([
        'procurement_type' => 'supply',
        'procurement_grades' => validDepartmentGrades(),
    ]);
    $this->actingAs($admin)->post(route('suppliers.approve', $invalidDepartmentSupplier), [
        'departments' => [],
    ])->assertSessionHasErrors('departments');

    $this->actingAs($admin)->post(route('suppliers.approve', $invalidDepartmentSupplier), [
        'departments' => ['mep', 'mep', 'supplier'],
    ])->assertSessionHasErrors(['departments.1', 'departments.2']);

    expect($invalidDepartmentSupplier->departmentReviews()->count())->toBe(0);
});

it('uses the correct MEP rubric for each procurement type', function () {
    $reviewer = User::factory()->create(['role' => 'mep']);
    $supplier = Supplier::factory()->submitted()->create([
        'procurement_type' => 'supply,service',
        'status' => 'pending',
        'approval_stage' => 'department_review',
    ]);
    $supplier->departmentReviews()->create([
        'department' => 'mep',
        'status' => 'assigned',
    ]);
    $grades = [
        ...validMepGrades(),
        'service' => [
            'system_certificate' => 4,
            'product_certificate' => 5,
            'litigation_history' => 5,
            'product_catalogue' => 6,
        ],
    ];

    $this->actingAs($reviewer)
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->where('gradeGroups.0.criteria.0.key', 'system_certificate')
            ->where('gradeGroups.0.maximumScore', 20)
            ->where('gradeGroups.1.criteria.2.key', 'litigation_history')
            ->where('gradeGroups.1.maximumScore', 20)
        );

    $this->actingAs($reviewer)
        ->post(route('suppliers.departmental-grades.store', $supplier), ['grades' => $grades])
        ->assertRedirectToRoute('suppliers.show', $supplier);

    expect(
        SupplierReviewHistory::query()
            ->where('supplier_id', $supplier->id)
            ->where('event_type', 'department_graded')
            ->value('grade_snapshot'),
    )->toBe([
        'supply' => [
            'system_certificate' => 4,
            'product_certificate' => 5,
            'test_report' => 5,
            'product_catalogue' => 6,
        ],
        'service' => [
            'system_certificate' => 4,
            'product_certificate' => 5,
            'litigation_history' => 5,
            'product_catalogue' => 6,
        ],
    ]);
});

it('grades Commercial, Finance, HSE, and Quality without procurement types', function () {
    $rubrics = [
        'commercial' => [
            'contract_amount_supply_chain' => 5,
            'years_of_experience' => 5,
            'executed_projects' => 5,
            'ongoing_contracts' => 5,
            'client_reference' => 5,
        ],
        'finance' => [
            'asset' => 3,
            'working_capital' => 3,
            'revenue' => 3,
            'stock_inventory_ratio' => 3,
            'equity_liability_ratio' => 3,
            'qualified_opinion' => 2,
            'unqualified_opinion' => 3,
        ],
        'hse' => [
            'documentation_certification' => 2,
            'employee_competency_safety' => 8,
            'housekeeping_waste_management' => 4,
            'agreement_commitment' => 1,
        ],
        'qaqc' => [
            'company_profile' => 5,
            'organizational_structure' => 3,
            'address' => 4,
            'product_list' => 4,
            'legal_document' => 4,
        ],
    ];
    $contributionPercents = [
        'commercial' => 25,
        'finance' => 20,
        'hse' => 20,
        'qaqc' => null,
    ];

    foreach ($rubrics as $department => $criteria) {
        $supplier = Supplier::factory()->submitted()->create([
            'procurement_type' => null,
            'status' => 'pending',
            'approval_stage' => 'department_review',
        ]);
        $supplier->departmentReviews()->create([
            'department' => $department,
            'status' => 'assigned',
        ]);
        $reviewer = User::factory()->create(['role' => $department]);
        $scores = array_map(static fn (int $maximumScore): int => $maximumScore, $criteria);

        $this->actingAs($reviewer)
            ->get(route('suppliers.show', $supplier))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gradeGroups.0.key', 'general')
                ->where('gradeGroups.0.maximumScore', array_sum($criteria))
                ->where('gradeGroups.0.contributionPercent', $contributionPercents[$department])
            );

        $this->actingAs($reviewer)
            ->post(route('suppliers.departmental-grades.store', $supplier), [
                'grades' => ['general' => $scores],
            ])
            ->assertRedirectToRoute('suppliers.show', $supplier);

        $this->actingAs($reviewer)
            ->get(route('suppliers.show', $supplier))
            ->assertInertia(fn (Assert $page) => $page->where('canApproveDepartment', true));

        $gradeSnapshot = SupplierReviewHistory::query()
            ->where('supplier_id', $supplier->id)
            ->where('event_type', 'department_graded')
            ->firstOrFail()
            ->grade_snapshot;

        expect($gradeSnapshot['general'])->toBe($scores);

        if ($department === 'hse') {
            $invalidScores = $scores;
            $invalidScores['employee_competency_safety'] = 9;

            $this->actingAs($reviewer)
                ->post(route('suppliers.departmental-grades.store', $supplier), [
                    'grades' => ['general' => $invalidScores],
                ])
                ->assertSessionHasErrors('grades.general.employee_competency_safety');

            expect(
                SupplierReviewHistory::query()
                    ->where('supplier_id', $supplier->id)
                    ->where('event_type', 'department_graded')
                    ->count(),
            )->toBe(1);
        }
    }
});

it('keeps IT, Marketing, P&E, and Design on the existing procurement type rubric', function () {
    foreach (['it', 'marketing', 'pe', 'design'] as $department) {
        $supplier = Supplier::factory()->submitted()->create([
            'procurement_type' => 'supply',
            'status' => 'pending',
            'approval_stage' => 'department_review',
        ]);
        $supplier->departmentReviews()->create([
            'department' => $department,
            'status' => 'assigned',
        ]);
        $reviewer = User::factory()->create(['role' => $department]);

        $this->actingAs($reviewer)
            ->get(route('suppliers.show', $supplier))
            ->assertInertia(fn (Assert $page) => $page
                ->where('gradeGroups.0.key', 'supply')
                ->where('gradeGroups.0.maximumScore', 20)
                ->where('gradeGroups.0.criteria.0.key', 'company_profile')
            );

        $this->actingAs($reviewer)
            ->post(route('suppliers.departmental-grades.store', $supplier), [
                'grades' => validDepartmentGrades(),
            ])
            ->assertRedirectToRoute('suppliers.show', $supplier);

        $this->actingAs($reviewer)
            ->get(route('suppliers.show', $supplier))
            ->assertInertia(fn (Assert $page) => $page->where('canApproveDepartment', true));
    }
});

it('keeps a supplier pending until every assigned department approves', function () {
    $initialGrades = validDepartmentGrades();
    $supplier = Supplier::factory()->submitted()->create([
        'procurement_type' => 'supply',
        'procurement_grades' => $initialGrades,
        'status' => 'pending',
        'approval_department' => 'mep',
        'approval_stage' => 'department_review',
        'department_review_status' => 'assigned',
    ]);
    $supplier->departmentReviews()->createMany([
        ['department' => 'mep', 'status' => 'assigned'],
        ['department' => 'it', 'status' => 'assigned'],
    ]);
    $mepReviewer = User::factory()->create(['role' => 'mep']);
    $itReviewer = User::factory()->create(['role' => 'it']);
    $financeReviewer = User::factory()->create(['role' => 'finance']);

    $this->actingAs($financeReviewer)
        ->post(route('suppliers.departmental-grades.store', $supplier), ['grades' => validDepartmentGrades()])
        ->assertNotFound();

    $this->actingAs($itReviewer)
        ->get(route('suppliers.show', $supplier))
        ->assertOk();

    $this->actingAs($itReviewer)
        ->get(route('suppliers.documents', $supplier))
        ->assertOk();

    $this->actingAs($mepReviewer)
        ->post(route('suppliers.departmental-approve', $supplier))
        ->assertStatus(422);

    $departmentGrades = validMepGrades();
    $departmentGrades['supply']['system_certificate'] = 3;

    $this->actingAs($mepReviewer)
        ->post(route('suppliers.departmental-grades.store', $supplier), ['grades' => $departmentGrades])
        ->assertRedirectToRoute('suppliers.show', $supplier);

    $this->actingAs($mepReviewer)
        ->post(route('suppliers.departmental-approve', $supplier))
        ->assertRedirect();

    $supplier->refresh();

    expect($supplier->status)->toBe('pending')
        ->and($supplier->approval_stage)->toBe('department_review')
        ->and($supplier->procurement_grades)->toBe($initialGrades)
        ->and($supplier->departmentReviews()->where('department', 'mep')->value('status'))->toBe('completed')
        ->and($supplier->departmentReviews()->where('department', 'it')->value('status'))->toBe('assigned');

    $departmentGrade = SupplierReviewHistory::query()
        ->where('supplier_id', $supplier->id)
        ->where('event_type', 'department_graded')
        ->firstOrFail();

    expect($departmentGrade->department)->toBe('mep')
        ->and($departmentGrade->actor_id)->toBe($mepReviewer->id)
        ->and($departmentGrade->grade_snapshot['supply']['system_certificate'])->toBe(3);

    $this->assertDatabaseHas('supplier_review_histories', [
        'supplier_id' => $supplier->id,
        'event_type' => 'department_approved',
        'department' => 'mep',
        'actor_id' => $mepReviewer->id,
    ]);

    $itDepartmentGrades = validDepartmentGrades();
    $itDepartmentGrades['supply']['company_profile'] = 4;

    $this->actingAs($itReviewer)
        ->post(route('suppliers.departmental-grades.store', $supplier), ['grades' => $itDepartmentGrades])
        ->assertRedirectToRoute('suppliers.show', $supplier);

    $this->actingAs($itReviewer)
        ->post(route('suppliers.departmental-approve', $supplier))
        ->assertRedirect();

    expect($supplier->fresh()->status)->toBe('approved')
        ->and($supplier->fresh()->approval_stage)->toBe('department_review_completed')
        ->and($supplier->fresh()->department_review_status)->toBe('completed');

    $this->actingAs(User::factory()->create(['role' => Role::ADMIN]))
        ->get(route('suppliers.show', $supplier))
        ->assertInertia(fn (Assert $page) => $page
            ->where('supplier.status', 'approved')
            ->where('supplier.approval_stage', 'department_review_completed')
            ->where('canInitiateHandoff', false)
            ->where('canManageAdminReview', false)
            ->where('isSupplierApproved', true)
            ->where('isDepartmentReview', false)
        );

    $this->assertDatabaseHas('supplier_status_histories', [
        'supplier_id' => $supplier->id,
        'previous_status' => 'pending',
        'new_status' => 'approved',
        'changed_by' => $itReviewer->id,
    ]);

    $this->actingAs($mepReviewer)
        ->post(route('suppliers.departmental-grades.store', $supplier), ['grades' => $departmentGrades])
        ->assertStatus(409);
});
