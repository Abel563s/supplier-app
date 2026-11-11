<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProcurementRequestSupplier extends Model
{
    protected $fillable = [
        'procurement_request_id',
        'supplier_id',
        'selected',
        'approved',
        'selection_reason',
        'override_reason',
        'selected_by',
        'selected_at',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'selected' => 'boolean',
            'approved' => 'boolean',
            'selected_at' => 'datetime',
            'approved_at' => 'datetime',
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

    public function selector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'selected_by');
    }
}
