<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->date('tax_clearance_from')->nullable()->after('tax_clearance_expiry');
            $table->date('tax_clearance_to')->nullable()->after('tax_clearance_from');
            $table->string('specialization', 255)->nullable()->after('sub_category');
            $table->string('procurement_type')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->enum('procurement_type', ['supply', 'service', 'both'])->nullable()->change();
            $table->dropColumn(['tax_clearance_from', 'tax_clearance_to', 'specialization']);
        });
    }
};
