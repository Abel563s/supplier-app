<?php

namespace App\Services;

use App\Mail\SupplierNotificationMail;
use App\Models\Supplier;
use App\Models\User;
use App\Notifications\SupplierNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Number of hours within which an identical unread notification is suppressed.
     */
    private const DEDUP_WINDOW_HOURS = 24;

    /**
     * Notify the given users with a supplier notification.
     *
     * @param  User|Collection|array<int, User>  $users
     * @param  array<string, mixed>  $data
     */
    public function notify(User|array|Collection $users, array $data): int
    {
        $users = $users instanceof User ? [$users] : iterator_to_array($users->getIterator());

        $count = 0;

        foreach ($users as $user) {
            if ($this->send($user, $data)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function send(User $user, array $data): bool
    {
        $event = $data['event'] ?? null;

        if ($event !== null && ! $user->wantsNotification($event)) {
            return false;
        }

        if ($this->isDuplicate($user, $data)) {
            return false;
        }

        DB::transaction(function () use ($user, $data): void {
            $user->notify(new SupplierNotification($data));

            $this->queueEmail($user, $data);
        });

        return true;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function isDuplicate(User $user, array $data): bool
    {
        $event = $data['event'] ?? null;
        $supplierId = $data['supplier_id'] ?? null;

        if ($event === null && $supplierId === null) {
            return false;
        }

        $query = $user->notifications()
            ->where('type', SupplierNotification::class)
            ->whereNull('read_at')
            ->where('created_at', '>=', now()->subHours(self::DEDUP_WINDOW_HOURS));

        if ($event !== null) {
            $query->where('data->event', $event);
        }

        if ($supplierId !== null) {
            $query->where('data->supplier_id', $supplierId);
        }

        return $query->exists();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function queueEmail(User $user, array $data): void
    {
        $settings = $user->notificationSettings();

        if (! ($settings['email'] ?? true)) {
            return;
        }

        $category = $data['category'] ?? null;
        $categories = $settings['categories'] ?? [];

        if ($category !== null && isset($categories[$category]) && ! $categories[$category]) {
            return;
        }

        try {
            Mail::to($user->email, $user->name)
                ->queue(new SupplierNotificationMail($data));
        } catch (\Throwable $e) {
            // Email delivery must never prevent the database notification from being created.
            \Log::warning('Supplier notification email could not be queued.', [
                'user_id' => $user->id,
                'event' => $data['event'] ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyAdmins(array $data): int
    {
        return $this->notify(User::where('role', 'admin')->get(), $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyDepartment(string $department, array $data): int
    {
        return $this->notify(User::where('role', $department)->get(), $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplier(Supplier $supplier, array $data): int
    {
        $user = $supplier->user;

        if (! $user) {
            return 0;
        }

        return $this->notify($user, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierRegistered(Supplier $supplier): int
    {
        $data = $this->basePayload(
            'supplier_registered',
            'supplier_registration',
            'New supplier registration submitted',
            "{$supplier->legal_name} has submitted a registration application.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierUpdated(Supplier $supplier): int
    {
        $data = $this->basePayload(
            'supplier_updated',
            'supplier_update',
            'Supplier registration information updated',
            "{$supplier->legal_name} has updated their registration information.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierDocumentsSubmitted(Supplier $supplier): int
    {
        $data = $this->basePayload(
            'supplier_documents_submitted',
            'documents',
            'New supplier documents submitted',
            "New documents have been submitted for {$supplier->legal_name}.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierResubmitted(Supplier $supplier): int
    {
        $data = $this->basePayload(
            'supplier_resubmitted',
            'supplier_update',
            'Supplier resubmitted requested information',
            "{$supplier->legal_name} has resubmitted the requested information.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierAssigned(Supplier $supplier, string $department): int
    {
        $data = $this->basePayload(
            'supplier_assigned',
            'review_assignment',
            'A new supplier is awaiting your review',
            "{$supplier->legal_name} has been assigned to your department for review.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyDepartment($department, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyDepartmentGraded(Supplier $supplier, string $department): int
    {
        $data = $this->basePayload(
            'department_graded',
            'grading',
            'Departmental grading submitted',
            "The {$department} department has submitted grading for {$supplier->legal_name}.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyDepartmentApproved(Supplier $supplier, string $department): int
    {
        $data = $this->basePayload(
            'department_approved',
            'approval',
            'Departmental review approved',
            "The {$department} department has approved its review of {$supplier->legal_name}.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifyAdditionalInfoRequested(Supplier $supplier, string $section, string $reason): int
    {
        $data = $this->basePayload(
            'supplier_additional_info_requested',
            'review_assignment',
            'Additional information required',
            "Additional information is required for your registration of {$supplier->legal_name} ({$section}).",
            route('suppliers.show', $supplier),
            $supplier,
            ['section' => $section, 'reason' => $reason],
        );

        return $this->notifySupplier($supplier, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierIncomplete(Supplier $supplier): int
    {
        $data = $this->basePayload(
            'supplier_incomplete',
            'supplier_registration',
            'Registration incomplete',
            "Your supplier registration for {$supplier->legal_name} is incomplete. Please complete the required information.",
            route('supplier.dashboard'),
            $supplier,
        );

        return $this->notifySupplier($supplier, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function notifySupplierStatusChanged(Supplier $supplier, string $status): int
    {
        $labels = [
            'submitted' => 'Registration Submitted',
            'pending' => 'Under Initial Admin Review',
            'under_review' => 'Assigned to Department',
            'needs_correction' => 'Additional Information Required',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
        ];

        $statusMessages = [
            'submitted' => 'Your supplier registration has been submitted and is awaiting review.',
            'pending' => 'Your supplier registration is under initial admin review.',
            'under_review' => 'Your supplier registration has been assigned to a department for review.',
            'needs_correction' => 'Additional information is required for your registration.',
            'approved' => 'Congratulations! Your supplier registration has been approved.',
            'rejected' => 'Your supplier registration has been rejected.',
        ];

        $title = $labels[$status] ?? ucfirst(str_replace('_', ' ', $status));
        $body = $statusMessages[$status] ?? "Your supplier registration status has changed to {$status}.";

        $category = match ($status) {
            'approved' => 'approval',
            'rejected' => 'rejection',
            default => 'supplier_registration',
        };

        $event = 'supplier_status_'.$status;

        $data = $this->basePayload(
            $event,
            $category,
            $title,
            $body,
            route('supplier.dashboard'),
            $supplier,
        );

        return $this->notifySupplier($supplier, $data);
    }

    public function notifySupplierApproved(Supplier $supplier): int
    {
        return $this->notifySupplierStatusChanged($supplier, 'approved');
    }

    public function notifySupplierRejected(Supplier $supplier): int
    {
        return $this->notifySupplierStatusChanged($supplier, 'rejected');
    }

    public function notifyDepartmentRejected(Supplier $supplier, string $department): int
    {
        $data = $this->basePayload(
            'department_rejected',
            'rejection',
            'Departmental review rejected',
            "The {$department} department has rejected its review of {$supplier->legal_name}.",
            route('suppliers.show', $supplier),
            $supplier,
        );

        return $this->notifyAdmins($data);
    }

    /**
     * @param  array<string, mixed>  $extra
     * @return array<string, mixed>
     */
    private function basePayload(string $event, string $category, string $title, string $body, string $url, Supplier $supplier, array $extra = []): array
    {
        return array_merge([
            'event' => $event,
            'category' => $category,
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'supplier_id' => $supplier->id,
            'supplier_name' => $supplier->legal_name,
            'supplier_trade_name' => $supplier->trade_name,
        ], $extra);
    }
}
