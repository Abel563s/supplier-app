<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProcurementRequest extends Model
{
    /** @use HasFactory<Database\Factories\ProcurementRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'subcategory_id',
        'subcategory',
        'primary_business_category',
        'procurement_type',
        'specialization',
        'procurement_method',
        'ro_number',
        'ro_document',
        'tech_spec_document',
        'number_of_suppliers_required',
        'purpose_notes',
        'established_before',
        'established_after',
        'minimum_capital',
        'prefer_successful_suppliers',
        'require_valid_trade_license',
        'require_tax_clearance',
        'require_business_registration',
        'require_tin_certificate',
        'require_vat_registration_certificate',
        'require_egp_registration_letter',
        'vat_exempt_procurement',
        'require_excise_tax',
        'require_audited_financial_statements',
        'require_manufacturer_authorization',
        'minimum_similar_contracts',
        'look_back_years',
        'minimum_contract_value',
        'minimum_annual_turnover',
        'production_capacity_multiple',
        'status',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'prefer_successful_suppliers' => 'boolean',
            'require_valid_trade_license' => 'boolean',
            'require_tax_clearance' => 'boolean',
            'require_business_registration' => 'boolean',
            'require_tin_certificate' => 'boolean',
            'require_vat_registration_certificate' => 'boolean',
            'require_egp_registration_letter' => 'boolean',
            'vat_exempt_procurement' => 'boolean',
            'require_excise_tax' => 'boolean',
            'require_audited_financial_statements' => 'boolean',
            'require_manufacturer_authorization' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'subcategory_id');
    }

    public function selectedSuppliers(): HasMany
    {
        return $this->hasMany(ProcurementRequestSupplier::class);
    }

    public function matches(): HasMany
    {
        return $this->hasMany(ProcurementRequestMatch::class);
    }
}
