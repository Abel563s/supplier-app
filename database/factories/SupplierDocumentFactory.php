<?php

namespace Database\Factories;

use App\Models\Supplier;
use App\Models\SupplierDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupplierDocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'document_type' => fake()->randomElement(SupplierDocument::TYPES),
            'file_name' => fake()->word().'.'.fake()->fileExtension(),
            'file_path' => fake()->filePath(),
            'file_size' => fake()->numberBetween(10000, 5000000),
            'file_type' => fake()->fileExtension(),
            'uploaded_at' => fake()->dateTimeThisYear(),
            'review_status' => 'pending',
            'review_notes' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }
}
