<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierContractFactory extends Factory
{
    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'client_project_name' => fake()->company().' - '.fake()->word().' Project',
            'nature_similarity' => fake()->sentence(),
            'contract_value' => fake()->randomFloat(2, 10000, 50000000),
            'contract_date' => fake()->dateTimeThisDecade(),
        ];
    }
}
