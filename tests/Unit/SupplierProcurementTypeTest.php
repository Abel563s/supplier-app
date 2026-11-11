<?php

use App\Models\Supplier;

it('expands the legacy both procurement type into a list', function () {
    $supplier = new Supplier(['procurement_type' => 'both']);

    expect($supplier->procurement_type_list)->toBe(['supply', 'service']);
});

it('splits stored procurement types into a list', function () {
    $supplier = new Supplier(['procurement_type' => 'supply,consulting']);

    expect($supplier->procurement_type_list)->toBe(['supply', 'consulting']);
});

it('returns an empty list when no procurement type is stored', function () {
    $supplier = new Supplier(['procurement_type' => null]);

    expect($supplier->procurement_type_list)->toBe([]);
});
