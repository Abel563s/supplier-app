<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierDepartmentReview extends Model
{
    protected $fillable = [
        'supplier_id',
        'department',
        'assigned_by',
        'assigned_at',
        'reviewer_id',
        'status',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'approved_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function departmentRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'department', 'key');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
