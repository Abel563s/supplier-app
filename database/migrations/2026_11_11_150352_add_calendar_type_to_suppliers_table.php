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
            $table->enum('trade_license_calendar_type', ['gregorian', 'ethiopian'])->nullable()->after('trade_license_renewed_date');
            $table->date('trade_license_date_original')->nullable()->after('trade_license_calendar_type');
        });
    }

    public function down(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropColumn(['trade_license_calendar_type', 'trade_license_date_original']);
        });
    }
};
