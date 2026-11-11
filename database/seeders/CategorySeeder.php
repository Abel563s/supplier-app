<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Supplier Type', 'slug' => 'supplier-type', 'sort_order' => 1, 'children' => [
                ['name' => 'Manufacturer', 'slug' => 'manufacturer', 'sort_order' => 1],
                ['name' => 'Retailer', 'slug' => 'retailer', 'sort_order' => 2],
                ['name' => 'Wholesaler / Distributor', 'slug' => 'wholesaler-distributor', 'sort_order' => 3],
                ['name' => 'Importer/Trader', 'slug' => 'importer-trader', 'sort_order' => 4],
                ['name' => 'Service Provider', 'slug' => 'service-provider', 'sort_order' => 5],
            ]],
            ['name' => 'Engineering Works & Consulting', 'slug' => 'engineering-works-consulting', 'sort_order' => 2, 'children' => [
                ['name' => 'Works / Construction Contractor', 'slug' => 'works-construction-contractor', 'sort_order' => 1],
                ['name' => 'Professional & Consulting Services', 'slug' => 'professional-consulting-services', 'sort_order' => 2],
                ['name' => 'Laboratory & Testing Services', 'slug' => 'laboratory-testing-services', 'sort_order' => 3],
            ]],
            ['name' => 'Goods & Materials', 'slug' => 'goods-materials', 'sort_order' => 3, 'children' => [
                ['name' => 'Construction Materials', 'slug' => 'construction-materials', 'sort_order' => 1],
                ['name' => 'Ceramics & Tiles', 'slug' => 'ceramics-tiles', 'sort_order' => 2],
                ['name' => 'Electrical & Electronics', 'slug' => 'electrical-electronics', 'sort_order' => 3],
                ['name' => 'Mechanical Equipment', 'slug' => 'mechanical-equipment', 'sort_order' => 4],
                ['name' => 'Heavy Equipment & Plant', 'slug' => 'heavy-equipment-plant', 'sort_order' => 5],
                ['name' => 'Furniture & Fixtures', 'slug' => 'furniture-fixtures', 'sort_order' => 6],
                ['name' => 'IT Software & Telecom', 'slug' => 'it-software-telecom', 'sort_order' => 7],
                ['name' => 'Office Supplies & Printing', 'slug' => 'office-supplies-printing', 'sort_order' => 8],
                ['name' => 'Automotive & Fleet', 'slug' => 'automotive-fleet', 'sort_order' => 9],
                ['name' => 'Medical & Safety Equipment', 'slug' => 'medical-safety-equipment', 'sort_order' => 10],
            ]],
            ['name' => 'Operational Services', 'slug' => 'operational-services', 'sort_order' => 4, 'children' => [
                ['name' => 'Logistic & Transport', 'slug' => 'logistic-transport', 'sort_order' => 1],
                ['name' => 'Security & Facility Services', 'slug' => 'security-facility-services', 'sort_order' => 2],
                ['name' => 'Utilities & Energy', 'slug' => 'utilities-energy', 'sort_order' => 3],
            ]],
            ['name' => 'Public & Institutional', 'slug' => 'public-institutional', 'sort_order' => 5, 'children' => [
                ['name' => 'Government / Public Sector', 'slug' => 'government-public-sector', 'sort_order' => 1],
                ['name' => 'NGO/Development Partner', 'slug' => 'ngo-development-partner', 'sort_order' => 2],
            ]],
        ];

        foreach ($categories as $parent) {
            $parentCategory = Category::create([
                'name' => $parent['name'],
                'slug' => $parent['slug'],
                'type' => 'business',
                'sort_order' => $parent['sort_order'],
            ]);

            foreach ($parent['children'] as $child) {
                Category::create([
                    'parent_id' => $parentCategory->id,
                    'name' => $child['name'],
                    'slug' => $child['slug'],
                    'type' => 'business',
                    'sort_order' => $child['sort_order'],
                ]);
            }
        }
    }
}
