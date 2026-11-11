<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the roles page with row numbering metadata for both tables', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('roles.index'));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/roles/index')
            ->has('admins.data')
            ->where('admins.from', 1)
            ->has('suppliers.data')
        );
});
