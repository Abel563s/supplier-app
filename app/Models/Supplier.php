<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    /** @use HasFactory<Database\Factories\SupplierFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'status',
        'submitted_at',
        'approval_department',
        'approval_stage',
        'department_review_status',
        'department_assigned_by',
        'department_assigned_at',
        'legal_form',
        'country_of_registration',
        'legal_name',
        'trade_name',
        'tin',
        'business_registration_no',
        'vat_registered',
        'vat_registration_no',
        'registered_capital',
        'date_established',
        'trade_license_renewed_date',
        'primary_contact_name',
        'primary_phone',
        'alternate_phone',
        'primary_email',
        'alternate_email',
        'city',
        'subcity',
        'woreda',
        'procurement_type',
        'primary_business_category',
        'sub_category',
        'specialization',
        'products_services_description',
        'bank_name',
        'branch_name',
        'account_number',
        'account_holder_name',
        'number_of_employees',
        'technical_personnel',
        'non_technical_personnel',
        'latest_annual_turnover',
        'annual_production_capacity',
        'capacity_unit',
        'tax_clearance_expiry',
        'tax_clearance_from',
        'tax_clearance_to',
        'tax_clearance_fiscal_year',
        'subject_to_excise_tax',
        'authorized_manufacturer_distributor',
        'signatory_title',
        'owner_ceo_name',
        'declaration_confirmed',
    ];

    protected $appends = [
        'procurement_type_list',
    ];

    protected function casts(): array
    {
        return [
            'vat_registered' => 'boolean',
            'subject_to_excise_tax' => 'boolean',
            'authorized_manufacturer_distributor' => 'boolean',
            'declaration_confirmed' => 'boolean',
            'submitted_at' => 'datetime',
            'department_assigned_at' => 'datetime',
            'date_established' => 'date',
            'trade_license_renewed_date' => 'date',
            'tax_clearance_expiry' => 'date',
            'tax_clearance_from' => 'date',
            'tax_clearance_to' => 'date',
            'procurement_grades' => 'array',
        ];
    }

    /**
     * Normalize legacy single-value procurement data into a list of supported types.
     *
     * @param  array<int, string>|string|null  $value
     * @return array<int, string>
     */
    public static function normalizeProcurementTypes(array|string|null $value): array
    {
        $legacyValues = [
            'both' => ['supply', 'service'],
        ];

        $selected = is_array($value)
            ? $value
            : array_filter(array_map('trim', explode(',', (string) $value)));

        $types = [];

        foreach ($selected as $type) {
            foreach ($legacyValues[$type] ?? [$type] as $normalized) {
                $types[$normalized] = true;
            }
        }

        return array_keys($types);
    }

    /**
     * Selected procurement types as a normalized list, expanding legacy single-value data.
     */
    public function procurementTypeList(): Attribute
    {
        return Attribute::get(fn (): array => self::normalizeProcurementTypes($this->procurement_type));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvalDepartment(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'approval_department', 'key');
    }

    public function departmentAssigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'department_assigned_by');
    }

    public function departmentReviews(): HasMany
    {
        return $this->hasMany(SupplierDepartmentReview::class);
    }

    public function reviewHistory(): HasMany
    {
        return $this->hasMany(SupplierReviewHistory::class)->latest();
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(SupplierContract::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SupplierDocument::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(SupplierStatusHistory::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(SupplierNote::class);
    }

    public function correctionRequests(): HasMany
    {
        return $this->hasMany(CorrectionRequest::class);
    }

    public function procurementRequestSuppliers(): HasMany
    {
        return $this->hasMany(ProcurementRequestSupplier::class);
    }

    public function procurementRequestMatches(): HasMany
    {
        return $this->hasMany(ProcurementRequestMatch::class);
    }
}
