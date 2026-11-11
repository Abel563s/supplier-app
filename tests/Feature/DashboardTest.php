<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users are redirected to the supplier dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')->assertRedirect(route('supplier.dashboard', absolute: false));
});

test('authenticated users can visit the supplier dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/supplier')->assertOk();
});
