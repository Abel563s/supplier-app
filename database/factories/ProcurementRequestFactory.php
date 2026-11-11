<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProcurementRequestFactory extends Factory
{
    public function definition(): array
    {
        $user = User::factory()->create(['role' => 'procurement']);

        return [
            'user_id' => $user->id,
            'category_id' => null,
            'subcategory_id' => null,
            'subcategory' => fake()->optional()->word(),
            'primary_business_category' => fake()->randomElement([
                'Manufacturer',
                'Retailer',
                'Wholesaler / Distributor',
                'Importer/Trader',
                'Service Provider',
                'Works / Construction Contractor',
                'Professional & Consulting Services',
                'Laboratory & Testing Services',
                'Construction Materials',
                'Ceramics & Tiles',
                'Electrical & Electronics',
                'Mechanical Equipment',
                'Heavy Equipment & Plant',
                'Furniture & Fixtures',
                'IT Software & Telecom',
                'Office Supplies & Printing',
                'Automotive & Fleet',
                'Medical & Safety Equipment',
                'Logistic & Transport',
                'Security & Facility Services',
                'Utilities & Energy',
                'Government / Public Sector',
                'NGO/Development Partner',
            ]),
            'procurement_type' => fake()->randomElement(['supply', 'service']),
            'number_of_suppliers_required' => fake()->numberBetween(1, 20),
            'purpose_notes' => fake()->optional()->sentence(),
            'established_before' => null,
            'established_after' => null,
            'minimum_capital' => fake()->optional()->numberBetween(50000, 5000000),
            'prefer_successful_suppliers' => fake()->boolean(60),
            'require_valid_trade_license' => fake()->boolean(80),
            'require_tax_clearance' => fake()->boolean(80),
            'vat_exempt_procurement' => fake()->boolean(20),
            'require_excise_tax' => fake()->boolean(20),
            'require_audited_financial_statements' => fake()->boolean(40),
            'require_manufacturer_authorization' => fake()->boolean(20),
            'minimum_similar_contracts' => fake()->optional()->numberBetween(1, 10),
            'look_back_years' => fake()->optional()->numberBetween(1, 10),
            'minimum_contract_value' => fake()->optional()->numberBetween(50000, 5000000),
            'minimum_annual_turnover' => fake()->optional()->numberBetween(100000, 10000000),
            'production_capacity_multiple' => fake()->optional()->numberBetween(1, 10),
            'status' => fake()->randomElement(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled']),
            'submitted_at' => fake()->optional()->dateTimeThisYear(),
        ];
    }
}
