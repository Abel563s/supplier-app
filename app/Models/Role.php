<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    public const ADMIN = 'admin';

    public const PROCUREMENT = 'procurement';

    public const SUPPLIER = 'supplier';

    public const DEPARTMENT = 'department';

    public const DEPARTMENT_KEYS = [
        'mep',
        'it',
        'qaqc',
        'marketing',
        'pe',
        'design',
        'finance',
        'commercial',
        'hse',
    ];

    protected $fillable = [
        'key',
        'name',
        'type',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role', 'key');
    }

    public function suppliers(): HasMany
    {
        return $this->hasMany(Supplier::class, 'approval_department', 'key');
    }

    public function departmentReviews(): HasMany
    {
        return $this->hasMany(SupplierDepartmentReview::class, 'department', 'key');
    }

    public function scopeDepartments(Builder $query): Builder
    {
        return $query->where('type', self::DEPARTMENT);
    }
}
