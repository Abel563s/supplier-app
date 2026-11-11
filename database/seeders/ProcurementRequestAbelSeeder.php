<?php

namespace Database\Seeders;

use App\Models\ProcurementRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProcurementRequestAbelSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::where('email', 'abel@proc.com')->firstOrFail();

        $requestExamples = [
            ['category' => 'Office Facilities', 'subcategory' => 'Office furniture and fittings', 'specialization' => 'Workstations and ergonomic seating', 'type' => 'supply', 'method' => 'rfq'],
            ['category' => 'Direct Construction Material', 'subcategory' => 'Concrete and aggregates', 'specialization' => 'Ready-mix concrete supply', 'type' => 'supply', 'method' => 'itb'],
            ['category' => 'Finishing', 'subcategory' => 'Interior finishing works', 'specialization' => 'Floor and wall finishing', 'type' => 'service', 'method' => 'rfp'],
            ['category' => 'MEP', 'subcategory' => 'Electrical systems', 'specialization' => 'Low-voltage installation', 'type' => 'non-consulting', 'method' => 'itb'],
            ['category' => 'Sub contractors', 'subcategory' => 'Waterproofing works', 'specialization' => 'Basement and roof waterproofing', 'type' => 'service', 'method' => 'rfq'],
            ['category' => 'Plant and Machinery', 'subcategory' => 'Construction equipment', 'specialization' => 'Earth-moving machinery', 'type' => 'supply', 'method' => 'rfp'],
            ['category' => 'Vehicle, Spare', 'subcategory' => 'Fleet spare parts', 'specialization' => 'Heavy-duty vehicle components', 'type' => 'supply', 'method' => 'itb'],
            ['category' => 'Consultant', 'subcategory' => 'Engineering consultancy', 'specialization' => 'Structural design review', 'type' => 'consulting', 'method' => 'rfp'],
            ['category' => 'Promotional', 'subcategory' => 'Communications services', 'specialization' => 'Campaign design and production', 'type' => 'service', 'method' => 'rfq'],
            ['category' => 'Cleaning and Security', 'subcategory' => 'Facility support', 'specialization' => 'Commercial cleaning services', 'type' => 'non-consulting', 'method' => 'itb'],
        ];

        foreach ($requestExamples as $index => $example) {
            ProcurementRequest::updateOrCreate([
                'user_id' => $user->id,
                'purpose_notes' => "Seeded supplier request for {$example['subcategory']}.",
            ], [
                'primary_business_category' => $example['category'],
                'subcategory' => $example['subcategory'],
                'specialization' => $example['specialization'],
                'procurement_type' => $example['type'],
                'procurement_method' => $example['method'],
                'ro_number' => 'ABEL-DEMO-'.now()->format('YmdHis').'-'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'number_of_suppliers_required' => ($index % 4) + 2,
                'minimum_capital' => $index % 3 === 0 ? 250000 * ($index + 1) : null,
                'minimum_similar_contracts' => $index % 3 === 1 ? 2 + ($index % 3) : null,
                'minimum_contract_value' => $index % 3 === 1 ? 500000 * ($index + 1) : null,
                'minimum_annual_turnover' => $index % 4 === 2 ? 1000000 * ($index + 1) : null,
                'status' => 'submitted',
                'submitted_at' => now()->subDays(9 - $index),
            ]);
        }
    }
}
