<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierReviewHistory extends Model
{
    protected $fillable = [
        'supplier_id',
        'event_type',
        'department',
        'actor_id',
        'grade_snapshot',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'grade_snapshot' => 'array',
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

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
