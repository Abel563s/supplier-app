<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;
use RuntimeException;

class SupplierRequestMatchingDemoSeeder extends Seeder
{
    public function run(): void
    {
        $supplierProfiles = [
            ['category' => 'Office Facilities', 'subcategory' => 'Office furniture and fittings', 'specialization' => 'Workstations and ergonomic seating', 'type' => 'supply'],
            ['category' => 'Direct Construction Material', 'subcategory' => 'Concrete and aggregates', 'specialization' => 'Ready-mix concrete supply', 'type' => 'supply'],
            ['category' => 'Finishing', 'subcategory' => 'Interior finishing works', 'specialization' => 'Floor and wall finishing', 'type' => 'service'],
            ['category' => 'MEP', 'subcategory' => 'Electrical systems', 'specialization' => 'Low-voltage installation', 'type' => 'non-consulting'],
            ['category' => 'Sub contractors', 'subcategory' => 'Waterproofing works', 'specialization' => 'Basement and roof waterproofing', 'type' => 'service'],
            ['category' => 'Plant and Machinery', 'subcategory' => 'Construction equipment', 'specialization' => 'Earth-moving machinery', 'type' => 'supply'],
            ['category' => 'Vehicle, Spare', 'subcategory' => 'Fleet spare parts', 'specialization' => 'Heavy-duty vehicle components', 'type' => 'supply'],
            ['category' => 'Consultant', 'subcategory' => 'Engineering consultancy', 'specialization' => 'Structural design review', 'type' => 'consulting'],
            ['category' => 'Promotional', 'subcategory' => 'Communications services', 'specialization' => 'Campaign design and production', 'type' => 'service'],
            ['category' => 'Cleaning and Security', 'subcategory' => 'Facility support', 'specialization' => 'Commercial cleaning services', 'type' => 'non-consulting'],
        ];

        $seededSuppliers = Supplier::query()
            ->where('status', 'approved')
            ->where('primary_email', 'like', '%@example.%')
            ->orderBy('id')
            ->limit(count($supplierProfiles))
            ->get();

        if ($seededSuppliers->count() !== count($supplierProfiles)) {
            throw new RuntimeException('Expected at least 10 approved example suppliers before seeding request-matching profiles.');
        }

        foreach ($supplierProfiles as $index => $profile) {
            $seededSuppliers[$index]->update([
                'primary_business_category' => $profile['category'],
                'sub_category' => $profile['subcategory'],
                'specialization' => $profile['specialization'],
                'procurement_type' => $profile['type'],
            ]);
        }
    }
}
