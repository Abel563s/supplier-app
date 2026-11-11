<?php

use App\Models\Supplier;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-10-14 12:00:00');
});

afterEach(function () {
    Carbon::setTestNow();
});

function makeApprovedSupplier(string $name, mixed $taxClearanceTo, array $attributes = []): Supplier
{
    return Supplier::factory()->create(array_merge([
        'status' => 'approved',
        'legal_name' => $name,
        'tin' => 'TIN-'.$name,
        'tax_clearance_to' => $taxClearanceTo,
    ], $attributes));
}

it('renders the tax expiry page with approved suppliers only', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $approved = makeApprovedSupplier('Expired Plc', Carbon::today()->subDays(12)->toDateString());
    makeApprovedSupplier('Draft Plc', Carbon::today()->subDays(3)->toDateString(), ['status' => 'draft']);
    makeApprovedSupplier('Pending Plc', Carbon::today()->addDays(5)->toDateString(), ['status' => 'submitted']);
    makeApprovedSupplier('Rejected Plc', Carbon::today()->subDays(1)->toDateString(), ['status' => 'rejected']);

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/tax-expiry/index')
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Expired Plc')
            ->where('summary.approved', 1)
            ->where('summary.expired', 1)
            ->where('today', '2026-10-14')
        );
});

it('calculates expiry status using calendar day boundaries', function (mixed $offset, string $expectedStatus, int $expectedDays, string $expectedTimeRemaining) {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Boundary Plc', Carbon::today()->addDays($offset)->toDateString());

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.data.0.status', $expectedStatus)
            ->where('suppliers.data.0.days_remaining', $expectedDays)
            ->where('suppliers.data.0.time_remaining', $expectedTimeRemaining)
        );
})->with([
    'expired' => [-12, 'expired', -12, '12 days ago'],
    'expired yesterday' => [-1, 'expired', -1, '1 day ago'],
    'expires today' => [0, 'today', 0, 'Expires today'],
    'one day remaining' => [1, 'critical', 1, '1 day remaining'],
    'seven days remaining' => [7, 'critical', 7, '7 days remaining'],
    'eight days remaining' => [8, 'upcoming', 8, '8 days remaining'],
    'thirty days remaining' => [30, 'upcoming', 30, '30 days remaining'],
    'thirty one days remaining' => [31, 'valid', 31, '31 days remaining'],
]);

it('summarises counts that match the underlying records', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Expired A', Carbon::today()->subDays(12)->toDateString());
    makeApprovedSupplier('Expired B', Carbon::today()->subDay()->toDateString());
    makeApprovedSupplier('Today Plc', Carbon::today()->toDateString());
    makeApprovedSupplier('Critical Plc', Carbon::today()->addDays(4)->toDateString());
    makeApprovedSupplier('Upcoming Plc', Carbon::today()->addDays(20)->toDateString());
    makeApprovedSupplier('Valid Plc', Carbon::today()->addDays(60)->toDateString());
    makeApprovedSupplier('Missing Plc', null);

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('summary.approved', 7)
            ->where('summary.expired', 2)
            ->where('summary.today', 1)
            ->where('summary.critical', 1)
            ->where('summary.upcoming', 1)
            ->where('summary.valid', 1)
            ->where('summary.missing', 1)
            ->where('summary.expiring_in_7_days', 2)
            ->where('summary.expiring_in_30_days', 3)
        );
});

it('keeps suppliers without an expiry date in the missing category', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('No Date Plc', null);
    makeApprovedSupplier('Dated Plc', Carbon::today()->addDays(10)->toDateString());

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.data.0.name', 'Dated Plc')
            ->where('suppliers.data.1.name', 'No Date Plc')
            ->where('suppliers.data.1.status', 'missing')
            ->where('suppliers.data.1.days_remaining', null)
            ->where('suppliers.data.1.time_remaining', 'No tax expiry date submitted')
        );

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['status' => 'missing']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'No Date Plc')
        );
});

it('sorts expired suppliers first and missing dates last', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Valid Plc', Carbon::today()->addDays(60)->toDateString());
    makeApprovedSupplier('Expired Plc', Carbon::today()->subDays(5)->toDateString());
    makeApprovedSupplier('No Date Plc', null);
    makeApprovedSupplier('Critical Plc', Carbon::today()->addDays(3)->toDateString());

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.data.0.name', 'Expired Plc')
            ->where('suppliers.data.1.name', 'Critical Plc')
            ->where('suppliers.data.2.name', 'Valid Plc')
            ->where('suppliers.data.3.name', 'No Date Plc')
        );

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['sort' => 'expiry_desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.data.0.name', 'Valid Plc')
            ->where('suppliers.data.3.name', 'No Date Plc')
        );
});

it('filters by expiry status', function (string $status, array $expectedNames) {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Expired Plc', Carbon::today()->subDays(2)->toDateString());
    makeApprovedSupplier('Today Plc', Carbon::today()->toDateString());
    makeApprovedSupplier('Critical Plc', Carbon::today()->addDays(5)->toDateString());
    makeApprovedSupplier('Upcoming Plc', Carbon::today()->addDays(20)->toDateString());
    makeApprovedSupplier('Valid Plc', Carbon::today()->addDays(90)->toDateString());
    makeApprovedSupplier('No Date Plc', null);

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['status' => $status]))
        ->assertInertia(function (Assert $page) use ($expectedNames) {
            $page->has('suppliers.data', count($expectedNames));

            foreach ($expectedNames as $index => $name) {
                $page->where("suppliers.data.{$index}.name", $name);
            }
        });
})->with([
    'expired' => ['expired', ['Expired Plc']],
    'today' => ['today', ['Today Plc']],
    'critical' => ['critical', ['Critical Plc']],
    'upcoming' => ['upcoming', ['Upcoming Plc']],
    'valid' => ['valid', ['Valid Plc']],
    'missing' => ['missing', ['No Date Plc']],
]);

it('filters by expiry period', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Expired Plc', Carbon::today()->subDays(3)->toDateString());
    makeApprovedSupplier('Today Plc', Carbon::today()->toDateString());
    makeApprovedSupplier('Critical Plc', Carbon::today()->addDays(5)->toDateString());
    makeApprovedSupplier('Beyond 30 Plc', Carbon::today()->addDays(45)->toDateString());
    makeApprovedSupplier('Beyond 90 Plc', Carbon::today()->addDays(120)->toDateString());

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['period' => 7]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 2)
            ->where('suppliers.data.0.name', 'Today Plc')
            ->where('suppliers.data.1.name', 'Critical Plc')
        );

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['period' => 30]))
        ->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 2));

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['period' => 90]))
        ->assertInertia(fn (Assert $page) => $page->has('suppliers.data', 3));
});

it('searches by supplier name and tin', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Alpha Construction', Carbon::today()->addDays(10)->toDateString(), ['tin' => 'TIN-111']);
    makeApprovedSupplier('Beta Trading', Carbon::today()->addDays(10)->toDateString(), ['tin' => 'TIN-222']);

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['search' => 'Alpha']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Alpha Construction')
        );

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['search' => 'TIN-222']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Beta Trading')
        );
});

it('combines search with filters and keeps the summary consistent', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Alpha Construction', Carbon::today()->subDays(2)->toDateString(), ['tin' => 'TIN-111']);
    makeApprovedSupplier('Alpha Trading', Carbon::today()->addDays(20)->toDateString(), ['tin' => 'TIN-222']);
    makeApprovedSupplier('Beta Construction', Carbon::today()->subDays(9)->toDateString(), ['tin' => 'TIN-333']);

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['search' => 'Alpha', 'status' => 'expired']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('suppliers.data.0.name', 'Alpha Construction')
            ->where('summary.approved', 2)
            ->where('summary.expired', 1)
        );
});

it('paginates the supplier list', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Supplier::factory()->count(20)->create([
        'status' => 'approved',
        'tax_clearance_to' => Carbon::today()->addDays(15)->toDateString(),
    ]);

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 15)
            ->where('suppliers.total', 20)
            ->where('suppliers.last_page', 2)
        );
});

it('ignores unsupported filter values', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Valid Plc', Carbon::today()->addDays(40)->toDateString());

    $this->actingAs($admin)
        ->get(route('tax-expiry', ['status' => 'bogus', 'sort' => 'bogus', 'period' => 'bogus']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('suppliers.data', 1)
            ->where('filters.status', 'all')
            ->where('filters.sort', 'expiry_asc')
            ->where('filters.period', null)
        );
});

it('exposes only the fields needed by the page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeApprovedSupplier('Field Check Plc', Carbon::today()->addDays(10)->toDateString(), [
        'business_registration_no' => 'BRN-9001',
        'primary_contact_name' => 'Abebe Kebede',
        'primary_phone' => '+251911234567',
        'trade_name' => 'Field Check Trading',
    ]);

    $this->actingAs($admin)
        ->get(route('tax-expiry'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('suppliers.data.0.business_registration_no', 'BRN-9001')
            ->where('suppliers.data.0.contact_name', 'Abebe Kebede')
            ->where('suppliers.data.0.contact_phone', '+251911234567')
            ->where('suppliers.data.0.trade_name', 'Field Check Trading')
            ->where('suppliers.data.0.expiry_date', Carbon::today()->addDays(10)->toDateString())
        );
});

it('forbids non-admin users from viewing the tax expiry page', function () {
    $user = User::factory()->create(['role' => 'supplier']);

    $this->actingAs($user)->get(route('tax-expiry'))->assertForbidden();
});

it('redirects guests to the login page', function () {
    $this->get(route('tax-expiry'))->assertRedirect('/login');
});

it('does not modify the submitted expiry date when viewing the page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $expiryDate = Carbon::today()->addDays(10)->toDateString();
    $supplier = makeApprovedSupplier('Untouched Plc', $expiryDate);

    $this->actingAs($admin)->get(route('tax-expiry'))->assertOk();

    expect($supplier->refresh()->tax_clearance_to->toDateString())->toBe($expiryDate)
        ->and($supplier->status)->toBe('approved');
});
