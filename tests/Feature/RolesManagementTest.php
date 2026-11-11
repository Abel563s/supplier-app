<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('updates role account details and password', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $roleUser = User::factory()->create(['role' => 'procurement']);

    $response = $this->actingAs($administrator)
        ->from('/admin/roles')
        ->put("/admin/roles/{$roleUser->id}", [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'role' => 'admin',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response->assertRedirectBack()->assertSessionHas('success', 'Role updated successfully.');
    $roleUser->refresh();
    expect($roleUser->name)->toBe('Updated User');
    expect($roleUser->email)->toBe('updated@example.com');
    expect($roleUser->role)->toBe('admin');
    expect(Hash::check('new-password', $roleUser->password))->toBeTrue();
});

it('preserves the password when a role user is updated without a new password', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $roleUser = User::factory()->create(['role' => 'procurement']);
    $existingPassword = $roleUser->password;

    $response = $this->actingAs($administrator)
        ->from('/admin/roles')
        ->put("/admin/roles/{$roleUser->id}", [
            'name' => 'Updated User',
            'email' => $roleUser->email,
            'role' => 'procurement',
            'password' => '',
            'password_confirmation' => '',
        ]);

    $response->assertRedirectBack()->assertSessionHas('success', 'Role updated successfully.');
    expect($roleUser->fresh()->password)->toBe($existingPassword);
});

it('deletes a role user', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $roleUser = User::factory()->create(['role' => 'procurement']);

    $response = $this->actingAs($administrator)
        ->from('/admin/roles')
        ->delete("/admin/roles/{$roleUser->id}");

    $response->assertRedirectBack()->assertSessionHas('success', 'Role deleted successfully.');
    $this->assertModelMissing($roleUser);
});

it('forbids an administrator from deleting their own account', function () {
    $administrator = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($administrator)
        ->delete("/admin/roles/{$administrator->id}");

    $response->assertForbidden();
    $this->assertModelExists($administrator);
});

it('forbids a procurement user from managing role accounts', function () {
    $procurementUser = User::factory()->create(['role' => 'procurement']);
    $roleUser = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($procurementUser)
        ->delete("/admin/roles/{$roleUser->id}");

    $response->assertForbidden();
    $this->assertModelExists($roleUser);
});

it('does not expose supplier accounts to role account deletion', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $supplierUser = User::factory()->create(['role' => 'supplier']);

    $response = $this->actingAs($administrator)
        ->delete("/admin/roles/{$supplierUser->id}");

    $response->assertNotFound();
    $this->assertModelExists($supplierUser);
});
