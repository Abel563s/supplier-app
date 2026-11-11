<?php

namespace Database\Seeders;

use App\Models\ProcurementRequest;
use Illuminate\Database\Seeder;

class ProcurementRequestSeeder extends Seeder
{
    public function run(): void
    {
        ProcurementRequest::factory()
            ->count(10)
            ->create();
    }
}
