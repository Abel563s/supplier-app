<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('procurement_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained();
            $table->foreignId('subcategory_id')->nullable()->constrained('categories');
            $table->enum('procurement_type', ['supply', 'service'])->nullable();
            $table->unsignedInteger('number_of_suppliers_required')->nullable();
            $table->text('purpose_notes')->nullable();
            $table->date('established_before')->nullable();
            $table->date('established_after')->nullable();
            $table->unsignedBigInteger('minimum_capital')->nullable();
            $table->boolean('prefer_successful_suppliers')->default(false);
            $table->boolean('require_valid_trade_license')->default(true);
            $table->boolean('require_tax_clearance')->default(true);
            $table->boolean('vat_exempt_procurement')->default(false);
            $table->boolean('require_excise_tax')->default(false);
            $table->boolean('require_audited_financial_statements')->default(false);
            $table->boolean('require_manufacturer_authorization')->default(false);
            $table->unsignedInteger('minimum_similar_contracts')->nullable();
            $table->unsignedInteger('look_back_years')->nullable();
            $table->unsignedBigInteger('minimum_contract_value')->nullable();
            $table->unsignedBigInteger('minimum_annual_turnover')->nullable();
            $table->unsignedInteger('production_capacity_multiple')->nullable();
            $table->enum('status', ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('procurement_requests');
    }
};
