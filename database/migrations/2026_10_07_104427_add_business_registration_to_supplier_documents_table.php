<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE supplier_documents MODIFY COLUMN document_type ENUM('business_registration', 'business_license', 'tin_certificate', 'vat_certificate', 'tax_clearance_certificate', 'excise_tax_registration', 'audited_financial_statements', 'manufacturer_distributor_auth', 'company_profile')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE supplier_documents MODIFY COLUMN document_type ENUM('business_license', 'tin_certificate', 'vat_certificate', 'tax_clearance_certificate', 'excise_tax_registration', 'audited_financial_statements', 'manufacturer_distributor_auth', 'company_profile')");
        }
    }
};
