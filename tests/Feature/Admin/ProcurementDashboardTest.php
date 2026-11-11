<?php

use App\Models\ProcurementRequest;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows only the signed-in procurement user’s request totals and recent requests', function () {
    $procurementUser = User::factory()->create(['role' => 'procurement']);
    $submittedRequest = ProcurementRequest::factory()->create([
        'user_id' => $procurementUser->id,
        'status' => 'submitted',
        'primary_business_category' => 'Construction Materials',
        'created_at' => now(),
    ]);
    ProcurementRequest::factory()->create([
        'user_id' => $procurementUser->id,
        'status' => 'approved',
        'created_at' => now()->subDay(),
    ]);
    ProcurementRequest::factory()->create([
        'status' => 'under_review',
        'created_at' => now()->addDay(),
    ]);

    $this->actingAs($procurementUser)
        ->get(route('procurement.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/procurement/dashboard')
            ->where('stats.total', 2)
            ->where('stats.submitted', 1)
            ->where('stats.approved', 1)
            ->where('stats.under_review', 0)
            ->has('recent', 2)
            ->where('recent.0.id', $submittedRequest->id)
            ->where('recent.0.primary_business_category', 'Construction Materials')
            ->where('userName', $procurementUser->name));
});
