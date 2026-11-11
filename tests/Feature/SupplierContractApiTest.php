<?php

use App\Models\Supplier;
use App\Models\User;

it('allows an authenticated supplier to create a similar contract', function () {
    $user = User::factory()->create([
        'email' => 'supplier@example.com',
        'role' => 'supplier',
    ]);

    Supplier::firstOrCreate([
        'user_id' => $user->id,
    ], [
        'status' => 'draft',
    ]);

    $response = $this
        ->actingAs($user)
        ->postJson('/supplier/registration/contracts', [
            'client_project_name' => 'Bridge Project',
            'nature_similarity' => 'Steel reinforcement',
            'contract_value' => 'ETB 3,500,000',
            'contract_date' => '2025-02-15',
        ]);

    $response->assertCreated();
    $response->assertJsonPath('client_project_name', 'Bridge Project');
    $response->assertJsonPath('nature_similarity', 'Steel reinforcement');
});
