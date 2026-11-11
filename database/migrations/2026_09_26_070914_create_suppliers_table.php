<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected'])->default('draft');
            $table->timestamp('submitted_at')->nullable();

            // Step 1 - Legal Entity & Identification
            $table->string('legal_form')->nullable();
            $table->string('country_of_registration')->nullable();
            $table->string('legal_name')->nullable();
            $table->string('trade_name')->nullable();
            $table->string('tin')->nullable();
            $table->string('business_registration_no')->nullable();
            $table->boolean('vat_registered')->default(false);
            $table->string('vat_registration_no')->nullable();
            $table->unsignedInteger('registered_capital')->nullable();
            $table->date('date_established')->nullable();
            $table->date('trade_license_renewed_date')->nullable();

            // Step 2 - Contact & Location
            $table->string('primary_contact_name')->nullable();
            $table->string('primary_phone')->nullable();
            $table->string('alternate_phone')->nullable();
            $table->string('primary_email')->nullable();
            $table->string('alternate_email')->nullable();
            $table->string('city')->nullable();
            $table->string('subcity')->nullable();
            $table->string('woreda')->nullable();

            // Step 3 - Business Scope & Categories
            $table->enum('procurement_type', ['supply', 'service', 'both'])->nullable();
            $table->string('primary_business_category')->nullable();
            $table->string('sub_category')->nullable();
            $table->text('products_services_description')->nullable();

            // Step 4 - Bank & Financial
            $table->string('bank_name')->nullable();
            $table->string('branch_name')->nullable();
            $table->string('account_number')->nullable();
            $table->string('account_holder_name')->nullable();
            $table->unsignedInteger('number_of_employees')->nullable();
            $table->unsignedBigInteger('latest_annual_turnover')->nullable();
            $table->string('annual_production_capacity')->nullable();
            $table->string('capacity_unit')->nullable();
            $table->date('tax_clearance_expiry')->nullable();
            $table->string('tax_clearance_fiscal_year')->nullable();
            $table->boolean('subject_to_excise_tax')->default(false);
            $table->boolean('authorized_manufacturer_distributor')->default(false);

            // Step 5 - Ownership & Signatory
            $table->string('signatory_title')->nullable();
            $table->string('owner_ceo_name')->nullable();

            // Step 7 - Declarations
            $table->boolean('declaration_confirmed')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
