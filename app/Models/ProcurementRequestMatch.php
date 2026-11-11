<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcurementRequestMatch extends Model
{
    protected $fillable = [
        'procurement_request_id',
        'supplier_id',
        'eligible',
        'match_score',
        'match_breakdown',
        'eligibility_reasons',
        'match_details',
        'matched_at',
    ];

    protected function casts(): array
    {
        return [
            'eligible' => 'boolean',
            'match_breakdown' => 'array',
            'eligibility_reasons' => 'array',
            'match_details' => 'array',
            'matched_at' => 'datetime',
        ];
    }

    public function procurementRequest(): BelongsTo
    {
        return $this->belongsTo(ProcurementRequest::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }
}
