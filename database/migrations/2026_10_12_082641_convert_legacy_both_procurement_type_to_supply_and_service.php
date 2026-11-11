<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('suppliers')
            ->where('procurement_type', 'both')
            ->update(['procurement_type' => 'supply,service']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('suppliers')
            ->where('procurement_type', 'supply,service')
            ->update(['procurement_type' => 'both']);
    }
};
