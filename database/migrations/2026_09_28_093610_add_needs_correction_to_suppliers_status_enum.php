<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE suppliers MODIFY COLUMN status ENUM('draft', 'submitted', 'under_review', 'needs_correction', 'approved', 'rejected') DEFAULT 'draft'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE suppliers MODIFY COLUMN status ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected') DEFAULT 'draft'");
        }
    }
};
