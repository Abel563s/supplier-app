<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierContract extends Model
{
    /** @use HasFactory<Database\Factories\SupplierContractFactory> */
    use HasFactory;

    protected $fillable = [
        'supplier_id',
        'client_project_name',
        'nature_similarity',
        'contract_value',
        'contract_date',
    ];

    protected function casts(): array
    {
        return [
            'contract_date' => 'date',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
