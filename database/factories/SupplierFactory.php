<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

class SupplierFactory extends Factory
{
    public function definition(): array
    {
        $user = User::factory()->create(['role' => 'supplier']);

        $taxClearanceFrom = fake()->optional(0.85)->dateTimeBetween('-1 year', 'now');
        $taxClearanceTo = $taxClearanceFrom
            ? Carbon::instance($taxClearanceFrom)->addDays(fake()->numberBetween(300, 400))
            : null;

        return [
            'user_id' => $user->id,
            'status' => 'draft',
            'submitted_at' => null,
            'legal_form' => fake()->randomElement(['sole_proprietorship', 'partnership', 'private_limited', 'public_limited', 'cooperative']),
            'country_of_registration' => 'Ethiopia',
            'legal_name' => fake()->company(),
            'trade_name' => fake()->company(),
            'tin' => fake()->numerify('#########'),
            'business_registration_no' => fake()->numerify('####/####/####'),
            'vat_registered' => fake()->boolean(70),
            'vat_registration_no' => fake()->optional(70)->numerify('#########'),
            'registered_capital' => fake()->numberBetween(50000, 50000000),
            'date_established' => fake()->optional(0.8)->dateTimeBetween('-10 years', 'now'),
            'trade_license_renewed_date' => fake()->optional(0.8)->dateTimeBetween('-1 year', '+2 years'),
            'primary_contact_name' => fake()->name(),
            'primary_phone' => '+251'.fake()->numerify('#########'),
            'alternate_phone' => fake()->optional()->phoneNumber(),
            'primary_email' => fake()->unique()->safeEmail(),
            'alternate_email' => fake()->optional()->safeEmail(),
            'city' => fake()->randomElement(['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Jimma', 'Adama', 'Gondar']),
            'subcity' => fake()->randomElement(['Bole', 'Kirkos', 'Arada', 'Lideta', 'Yeka', 'Akaky Kaliti', 'Nifas Silk Lafto']),
            'woreda' => fake()->numerify('##'),
            'procurement_type' => implode(',', fake()->randomElements(['supply', 'service', 'consulting', 'non-consulting'], fake()->numberBetween(1, 2))),
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
            'sub_category' => fake()->optional()->word(),
            'products_services_description' => fake()->optional()->sentence(),
            'bank_name' => fake()->randomElement(['Commercial Bank of Ethiopia', 'Dashen Bank', 'Awash Bank', 'Abyssinia Bank', 'Nib Bank']),
            'branch_name' => fake()->randomElement(['Main Branch', 'Bole Branch', 'Addis Branch', 'Central Branch']),
            'account_number' => fake()->numerify('################'),
            'account_holder_name' => fake()->name(),
            'number_of_employees' => fake()->numberBetween(5, 500),
            'latest_annual_turnover' => fake()->numberBetween(100000, 100000000),
            'annual_production_capacity' => fake()->optional()->numberBetween(1000, 1000000),
            'capacity_unit' => fake()->optional()->randomElement(['units', 'tons', 'liters', 'pieces', 'meters']),
            'technical_personnel' => fake()->numberBetween(1, 200),
            'non_technical_personnel' => fake()->numberBetween(1, 200),
            'tax_clearance_expiry' => $taxClearanceTo,
            'tax_clearance_from' => $taxClearanceFrom,
            'tax_clearance_to' => $taxClearanceTo,
            'tax_clearance_fiscal_year' => $taxClearanceTo ? Carbon::parse($taxClearanceTo)->year : null,
            'subject_to_excise_tax' => fake()->boolean(20),
            'authorized_manufacturer_distributor' => fake()->boolean(30),
            'signatory_title' => fake()->randomElement(['CEO', 'General Manager', 'Owner', 'Managing Director']),
            'owner_ceo_name' => fake()->name(),
            'declaration_confirmed' => false,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'submitted',
            'submitted_at' => now(),
            'declaration_confirmed' => true,
            'legal_form' => $attributes['legal_form'] ?? fake()->randomElement(['sole_proprietorship', 'partnership', 'private_limited', 'public_limited', 'cooperative']),
            'country_of_registration' => 'Ethiopia',
            'legal_name' => $attributes['legal_name'] ?? fake()->company(),
            'trade_name' => $attributes['trade_name'] ?? fake()->company(),
            'tin' => $attributes['tin'] ?? fake()->numerify('#########'),
            'business_registration_no' => $attributes['business_registration_no'] ?? fake()->numerify('####/####/####'),
            'registered_capital' => $attributes['registered_capital'] ?? fake()->numberBetween(50000, 50000000),
            'trade_license_renewed_date' => $attributes['trade_license_renewed_date'] ?? fake()->dateTimeBetween('-1 year', '+2 years'),
            'primary_contact_name' => $attributes['primary_contact_name'] ?? fake()->name(),
            'primary_phone' => $attributes['primary_phone'] ?? '+251'.fake()->numerify('#########'),
            'primary_email' => $attributes['primary_email'] ?? fake()->unique()->safeEmail(),
            'city' => $attributes['city'] ?? fake()->randomElement(['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Jimma', 'Adama', 'Gondar']),
            'woreda' => $attributes['woreda'] ?? fake()->numerify('##'),
            'procurement_type' => $attributes['procurement_type'] ?? fake()->randomElement(['supply', 'service', 'both']),
            'primary_business_category' => $attributes['primary_business_category'] ?? fake()->randomElement([
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
            'signatory_title' => $attributes['signatory_title'] ?? fake()->randomElement(['CEO', 'General Manager', 'Owner', 'Managing Director']),
            'owner_ceo_name' => $attributes['owner_ceo_name'] ?? fake()->name(),
        ]);
    }

    public function approved(): static
    {
        return $this->submitted()->state(fn (array $attributes) => [
            'status' => 'approved',
            'submitted_at' => $attributes['submitted_at'] ?? now()->subDays(7),
        ]);
    }
}
