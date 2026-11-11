<?php

use App\Models\ProcurementRequest;
use App\Models\ProcurementRequestSupplier;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lists every approved supplier in the selection letter', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $procurementRequest = ProcurementRequest::factory()->create();
    $suppliers = Supplier::factory()->count(3)->create();

    foreach ($suppliers as $supplier) {
        ProcurementRequestSupplier::create([
            'procurement_request_id' => $procurementRequest->id,
            'supplier_id' => $supplier->id,
            'selected' => true,
            'approved' => true,
        ]);
    }

    $response = $this->actingAs($administrator)
        ->get(route('procurement.requests.letter', $procurementRequest->id));

    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('proc/requests/letter')
            ->has('suppliers', 3)
            ->where('suppliers.0.id', $suppliers[0]->id)
            ->where('suppliers.0.legal_name', $suppliers[0]->legal_name)
            ->where('suppliers.0.primary_phone', $suppliers[0]->primary_phone)
            ->where('suppliers.0.alternate_phone', $suppliers[0]->alternate_phone)
            ->where('suppliers.1.id', $suppliers[1]->id)
            ->where('suppliers.2.id', $suppliers[2]->id)
        );
});

it('renders the printable letter with the approved suppliers', function () {
    $administrator = User::factory()->create(['role' => 'admin']);
    $procurementRequest = ProcurementRequest::factory()->create();
    $supplier = Supplier::factory()->create(['tin' => '0099887766', 'alternate_phone' => '+251911555666']);

    ProcurementRequestSupplier::create([
        'procurement_request_id' => $procurementRequest->id,
        'supplier_id' => $supplier->id,
        'selected' => true,
        'approved' => true,
    ]);

    $response = $this->actingAs($administrator)
        ->get(route('procurement.requests.letter.print', $procurementRequest->id));

    $response->assertOk()
        ->assertSee($supplier->legal_name)
        ->assertSee('0099887766')
        ->assertSee('+251911555666')
        ->assertSee('Company Details');
});
