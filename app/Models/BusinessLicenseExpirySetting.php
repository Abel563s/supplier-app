<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessLicenseExpirySetting extends Model
{
    protected $fillable = [
        'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'expiry_date' => 'date',
        ];
    }
}
