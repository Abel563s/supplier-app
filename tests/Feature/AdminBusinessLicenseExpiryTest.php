<?php

use App\Models\BusinessLicenseExpirySetting;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('lists approved suppliers with the shared expiry date and remaining time', function () {
    $this->travelTo(Carbon::parse('2026-11-08 12:00:00'));

    $admin = User::factory()->create(['role' => 'admin']);
    BusinessLicenseExpirySetting::query()->create(['expiry_date' => '2026-11-15']);
    Supplier::factory()->approved()->create(['legal_name' => 'Approved Supplier']);
    Supplier::factory()->create(['legal_name' => 'Draft Supplier', 'status' => 'draft']);

    $this->actingAs($admin)
        ->get(route('business-license-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/business-license-expiry/index')
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Approved Supplier')
            ->where('suppliers.data.0.expiry_date', '2026-11-15')
            ->where('suppliers.data.0.days_remaining', 7)
            ->where('suppliers.data.0.status', 'critical')
            ->where('summary.approved', 1)
            ->where('summary.critical', 1)
            ->where('summary.expiring_in_7_days', 1)
            ->where('today', '2026-11-08')
            ->where('expiryDate', '2026-11-15')
        );
});

it('filters suppliers by shared expiry status and period', function () {
    $this->travelTo(Carbon::parse('2026-11-08 12:00:00'));

    $admin = User::factory()->create(['role' => 'admin']);
    BusinessLicenseExpirySetting::query()->create(['expiry_date' => '2026-11-15']);
    Supplier::factory()->approved()->create(['legal_name' => 'Approved Supplier']);

    $this->actingAs($admin)
        ->get(route('business-license-expiry', ['status' => 'critical', 'period' => 7]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.status', 'critical')
            ->where('filters.period', 7)
        );

    $this->actingAs($admin)
        ->get(route('business-license-expiry', ['status' => 'upcoming']))
        ->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 0));
});

it('shows approved suppliers as missing until the shared expiry date is set', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Supplier::factory()->approved()->create();

    $this->actingAs($admin)
        ->get(route('business-license-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('expiryDate', null)
            ->where('suppliers.data.0.status', 'missing')
            ->where('suppliers.data.0.expiry_date', null)
            ->where('summary.missing', 1)
        );
});

it('updates the shared expiry date for current and future approved suppliers', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $existingSupplier = Supplier::factory()->approved()->create(['legal_name' => 'Existing Supplier']);
    Supplier::factory()->create(['status' => 'draft']);

    $this->actingAs($admin)
        ->put(route('business-license-expiry.update'), ['expiry_date' => '2030-07-01'])
        ->assertRedirect()
        ->assertSessionHas('success', 'Business license expiry date updated for all approved and future suppliers.');

    $setting = BusinessLicenseExpirySetting::query()->findOrFail(1);
    expect($setting->expiry_date->toDateString())->toBe('2030-07-01');

    Supplier::factory()->approved()->create(['legal_name' => 'Future Approved Supplier']);

    $this->actingAs($admin)
        ->get(route('business-license-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 2)
            ->where('expiryDate', '2030-07-01')
            ->where('suppliers.data.0.expiry_date', '2030-07-01')
            ->where('suppliers.data.1.expiry_date', '2030-07-01')
        );

    expect($existingSupplier->refresh()->status)->toBe('approved');
});

it('rejects invalid Gregorian dates without changing the configured expiry', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    BusinessLicenseExpirySetting::query()->create(['expiry_date' => '2030-07-01']);

    $this->actingAs($admin)
        ->from(route('business-license-expiry'))
        ->put(route('business-license-expiry.update'), ['expiry_date' => '2026-02-31'])
        ->assertRedirect(route('business-license-expiry'))
        ->assertSessionHasErrors('expiry_date');

    expect(BusinessLicenseExpirySetting::query()->findOrFail(1)->expiry_date->toDateString())->toBe('2030-07-01');
});

it('forbids non-admin users from viewing or changing the shared expiry date', function () {
    $user = User::factory()->create(['role' => 'supplier']);

    $this->actingAs($user)
        ->get(route('business-license-expiry'))
        ->assertForbidden();

    $this->actingAs($user)
        ->put(route('business-license-expiry.update'), ['expiry_date' => '2030-07-01'])
        ->assertForbidden();
});

it('redirects guests to the login page for business license expiry', function () {
    $this->get(route('business-license-expiry'))->assertRedirect('/login');

    $this->put(route('business-license-expiry.update'), ['expiry_date' => '2030-07-01'])
        ->assertRedirect('/login');
});
