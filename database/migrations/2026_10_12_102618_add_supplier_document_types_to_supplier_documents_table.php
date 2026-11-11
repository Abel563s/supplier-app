<?php

use App\Models\SupplierDocument;
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
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $types = collect(SupplierDocument::TYPES)
            ->map(fn (string $type): string => "'".$type."'")
            ->join(', ');

        DB::statement("ALTER TABLE supplier_documents MODIFY COLUMN document_type ENUM({$types})");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $types = collect(SupplierDocument::REQUIRED_TYPES)
            ->merge(['excise_tax_registration', 'audited_financial_statements', 'manufacturer_distributor_auth', 'company_profile'])
            ->map(fn (string $type): string => "'".$type."'")
            ->join(', ');

        DB::statement("ALTER TABLE supplier_documents MODIFY COLUMN document_type ENUM({$types})");
    }
};
