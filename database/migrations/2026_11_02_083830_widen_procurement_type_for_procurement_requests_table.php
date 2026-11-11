<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('procurement_requests', function (Blueprint $table) {
            $table->string('procurement_type')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('procurement_requests')
            ->whereIn('procurement_type', ['consulting', 'non-consulting'])
            ->update(['procurement_type' => 'service']);

        Schema::table('procurement_requests', function (Blueprint $table) {
            $table->enum('procurement_type', ['supply', 'service'])->nullable()->change();
        });
    }
};
