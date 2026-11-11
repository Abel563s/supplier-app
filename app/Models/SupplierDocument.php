<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierDocument extends Model
{
    public const TYPES = [
        'business_registration',
        'business_license',
        'tin_certificate',
        'tax_clearance_certificate',
        'vat_certificate',
        'egp_registration_letter',
        'hse_commitment_letter',
        'testimonials',
        'excise_tax_registration',
        'audited_financial_statements',
        'manufacturer_distributor_auth',
        'company_profile',
    ];

    public const REQUIRED_TYPES = [
        'business_registration',
        'business_license',
        'tin_certificate',
        'tax_clearance_certificate',
        'vat_certificate',
        'egp_registration_letter',
        'hse_commitment_letter',
    ];

    public const LABELS = [
        'business_registration' => 'Business Registration',
        'business_license' => 'Business License',
        'tin_certificate' => 'TIN Certificate',
        'tax_clearance_certificate' => 'Tax Clearance Certificate',
        'vat_certificate' => 'VAT Registration Certificate',
        'egp_registration_letter' => 'EGP Registration Letter',
        'hse_commitment_letter' => 'HSE Commitment Letter',
        'testimonials' => 'Testimonials',
        'excise_tax_registration' => 'Excise Tax Registration',
        'audited_financial_statements' => 'Audited Financial Statements — Last 3 Years',
        'manufacturer_distributor_auth' => 'Manufacturer / Distributor Authorization',
        'company_profile' => 'Company Profile',
    ];

    /** @use HasFactory<Database\Factories\SupplierDocumentFactory> */
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'document_type',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'uploaded_at',
        'review_status',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * The document catalogue shared by the registration and admin review pages.
     *
     * @return array<int, array{key: string, label: string, required: bool}>
     */
    public static function catalog(): array
    {
        return array_map(fn (string $type): array => [
            'key' => $type,
            'label' => self::LABELS[$type] ?? str_replace('_', ' ', ucwords($type, '_')),
            'required' => in_array($type, self::REQUIRED_TYPES, true),
        ], self::TYPES);
    }
}
