<?php

use App\Models\ProcurementRequest;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows the request details and returns to the request list for its owner', function () {
    $procurementUser = User::factory()->create(['role' => 'procurement']);
    $procurementRequest = ProcurementRequest::factory()->create([
        'user_id' => $procurementUser->id,
        'primary_business_category' => 'Construction Materials',
        'purpose_notes' => 'Materials for the bridge project',
    ]);

    $this->actingAs($procurementUser)
        ->get(route('procurement.requests.show', $procurementRequest->id))
        ->assertInertia(fn (Assert $page) => $page
            ->component('proc/requests/show')
            ->where('request.id', $procurementRequest->id)
            ->where('request.purpose_notes', 'Materials for the bridge project'));

    $this->get(route('procurement.request-supplier'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/procurement/request-supplier')
            ->where('requests.0.id', $procurementRequest->id));
});

it('does not show another procurement user’s request', function () {
    $procurementUser = User::factory()->create(['role' => 'procurement']);
    $otherUsersRequest = ProcurementRequest::factory()->create();

    $this->actingAs($procurementUser)
        ->get(route('procurement.requests.show', $otherUsersRequest->id))
        ->assertNotFound();
});

it('allows administrators to view another procurement user’s request', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $otherUsersRequest = ProcurementRequest::factory()->create();

    $this->actingAs($administrator)
        ->get(route('procurement.requests.show', $otherUsersRequest->id))
        ->assertInertia(fn (Assert $page) => $page
            ->component('proc/requests/show')
            ->where('request.id', $otherUsersRequest->id));
});
