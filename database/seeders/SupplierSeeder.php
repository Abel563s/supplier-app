<?php

namespace Database\Seeders;

use App\Models\Supplier;
use App\Models\SupplierContract;
use App\Models\SupplierDocument;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        Supplier::factory()
            ->count(20)
            ->approved()
            ->has(
                SupplierContract::factory()->count(fake()->numberBetween(1, 4)),
                'contracts'
            )
            ->has(
                SupplierDocument::factory()->count(4),
                'documents'
            )
            ->create();
    }
}
