<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roleDefinition(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role', 'key');
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::ADMIN;
    }

    public function isDepartmentReviewer(): bool
    {
        return $this->roleDefinition?->type === Role::DEPARTMENT;
    }

    public function notificationSettings(): array
    {
        $defaults = [
            'in_app' => true,
            'email' => true,
            'categories' => [],
        ];

        $stored = is_array($this->notification_settings) ? $this->notification_settings : [];

        return array_replace_recursive($defaults, $stored);
    }

    /**
     * Determine whether the user should receive a notification for the given event.
     *
     * Mandatory responsibility notifications cannot be opted out of.
     */
    public function wantsNotification(string $event): bool
    {
        $meta = self::notificationEventMeta()[$event] ?? null;

        if ($meta === null) {
            return true;
        }

        $mandatoryRoles = $meta['mandatory'] ?? [];

        if ($mandatoryRoles !== []) {
            foreach ($mandatoryRoles as $mandatoryRole) {
                if ($mandatoryRole === 'admin' && $this->role === 'admin') {
                    return true;
                }
                if ($mandatoryRole === 'department' && $this->isDepartmentReviewer()) {
                    return true;
                }
                if ($mandatoryRole === 'supplier' && $this->role === 'supplier') {
                    return true;
                }
                if ($mandatoryRole === 'procurement' && $this->role === 'procurement') {
                    return true;
                }
            }
        }

        $settings = $this->notificationSettings();

        if (! $settings['in_app'] ?? true) {
            return false;
        }

        $category = $meta['category'] ?? null;

        if ($category !== null && isset($settings['categories'][$category])) {
            return (bool) $settings['categories'][$category];
        }

        return true;
    }

    public static function notificationEventMeta(): array
    {
        return [
            'supplier_registered' => ['category' => 'supplier_registration', 'mandatory' => ['admin']],
            'supplier_updated' => ['category' => 'supplier_update', 'mandatory' => ['admin']],
            'supplier_documents_submitted' => ['category' => 'documents', 'mandatory' => ['admin']],
            'supplier_resubmitted' => ['category' => 'supplier_update', 'mandatory' => ['admin']],
            'supplier_assigned' => ['category' => 'review_assignment', 'mandatory' => ['department']],
            'department_graded' => ['category' => 'grading', 'mandatory' => ['admin']],
            'department_approved' => ['category' => 'approval', 'mandatory' => ['admin']],
            'department_rejected' => ['category' => 'rejection', 'mandatory' => ['admin']],
            'supplier_additional_info_requested' => ['category' => 'review_assignment', 'mandatory' => ['supplier']],
            'supplier_incomplete' => ['category' => 'supplier_registration', 'mandatory' => ['supplier']],
            'supplier_status_submitted' => ['category' => 'supplier_registration', 'mandatory' => ['supplier']],
            'supplier_approved' => ['category' => 'approval', 'mandatory' => ['supplier']],
            'supplier_rejected' => ['category' => 'rejection', 'mandatory' => ['supplier']],
        ];
    }
}
