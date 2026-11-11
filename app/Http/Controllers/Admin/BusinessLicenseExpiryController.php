<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BusinessLicenseExpirySetting;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class BusinessLicenseExpiryController extends Controller
{
    private const SHARED_SETTING_ID = 1;

    /**
     * @var array<int, string>
     */
    private const STATUSES = ['expired', 'today', 'critical', 'upcoming', 'valid', 'missing'];

    /**
     * @var array<int, int>
     */
    private const PERIODS = [7, 30, 90];

    public function index(Request $request): Response
    {
        $today = Carbon::today();
        $expiryDate = BusinessLicenseExpirySetting::query()->find(self::SHARED_SETTING_ID)?->expiry_date;
        $expiryDateString = $expiryDate?->toDateString();
        $daysRemaining = $expiryDate === null ? null : (int) $today->diffInDays($expiryDate, false);
        $status = $daysRemaining === null ? 'missing' : $this->statusFor($daysRemaining);

        $filters = [
            'search' => $request->string('search')->trim()->toString(),
            'status' => $this->normalizeStatus($request->input('status')),
            'period' => $this->normalizePeriod($request->input('period')),
        ];

        $approvedSuppliers = Supplier::query()
            ->where('status', 'approved')
            ->when(
                $filters['search'] !== '',
                fn (Builder $query) => $query->where(
                    fn (Builder $query) => $query
                        ->where('legal_name', 'like', '%'.$filters['search'].'%')
                        ->orWhere('tin', 'like', '%'.$filters['search'].'%')
                )
            );
        $approvedCount = (clone $approvedSuppliers)->count();

        $summary = [
            'approved' => $approvedCount,
            'expired' => 0,
            'today' => 0,
            'critical' => 0,
            'upcoming' => 0,
            'valid' => 0,
            'missing' => 0,
            'expiring_in_7_days' => 0,
            'expiring_in_30_days' => 0,
        ];

        $summary[$status] = $approvedCount;
        $summary['expiring_in_7_days'] = $daysRemaining !== null && $daysRemaining >= 0 && $daysRemaining <= 7
            ? $approvedCount
            : 0;
        $summary['expiring_in_30_days'] = $daysRemaining !== null && $daysRemaining >= 0 && $daysRemaining <= 30
            ? $approvedCount
            : 0;

        $suppliers = $approvedSuppliers
            ->when(
                $filters['status'] !== 'all' && $filters['status'] !== $status,
                fn (Builder $query) => $query->whereIn('id', [])
            )
            ->when(
                $filters['period'] !== null
                    && ($daysRemaining === null || $daysRemaining < 0 || $daysRemaining > $filters['period']),
                fn (Builder $query) => $query->whereIn('id', [])
            )
            ->select([
                'id',
                'legal_name',
                'trade_name',
                'tin',
                'business_registration_no',
                'primary_contact_name',
                'primary_phone',
            ])
            ->orderBy('legal_name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Supplier $supplier): array => $this->transformSupplier(
                $supplier,
                $expiryDateString,
                $daysRemaining,
                $status,
            ));

        return Inertia::render('admin/business-license-expiry/index', [
            'suppliers' => $suppliers,
            'summary' => $summary,
            'filters' => $filters,
            'today' => $today->toDateString(),
            'expiryDate' => $expiryDateString,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expiry_date' => ['required', 'date_format:Y-m-d'],
        ]);

        BusinessLicenseExpirySetting::query()->updateOrCreate(
            ['id' => self::SHARED_SETTING_ID],
            ['expiry_date' => $validated['expiry_date']],
        );

        return back()->with('success', 'Business license expiry date updated for all approved and future suppliers.');
    }

    /**
     * @return array{
     *     id: int,
     *     name: string|null,
     *     trade_name: string|null,
     *     tin: string|null,
     *     business_registration_no: string|null,
     *     contact_name: string|null,
     *     contact_phone: string|null,
     *     expiry_date: string|null,
     *     days_remaining: int|null,
     *     status: string,
     *     status_label: string,
     *     time_remaining: string
     * }
     */
    private function transformSupplier(
        Supplier $supplier,
        ?string $expiryDate,
        ?int $daysRemaining,
        string $status,
    ): array {
        return [
            'id' => $supplier->id,
            'name' => $supplier->legal_name,
            'trade_name' => $supplier->trade_name,
            'tin' => $supplier->tin,
            'business_registration_no' => $supplier->business_registration_no,
            'contact_name' => $supplier->primary_contact_name,
            'contact_phone' => $supplier->primary_phone,
            'expiry_date' => $expiryDate,
            'days_remaining' => $daysRemaining,
            'status' => $status,
            'status_label' => $this->statusLabels()[$status],
            'time_remaining' => $this->humanizeDaysRemaining($daysRemaining),
        ];
    }

    private function statusFor(int $daysRemaining): string
    {
        return match (true) {
            $daysRemaining < 0 => 'expired',
            $daysRemaining === 0 => 'today',
            $daysRemaining <= 7 => 'critical',
            $daysRemaining <= 30 => 'upcoming',
            default => 'valid',
        };
    }

    private function humanizeDaysRemaining(?int $daysRemaining): string
    {
        return match (true) {
            $daysRemaining === null => 'No business license expiry date set',
            $daysRemaining === 0 => 'Expires today',
            $daysRemaining < 0 => abs($daysRemaining).' day'.(abs($daysRemaining) === 1 ? '' : 's').' ago',
            $daysRemaining === 1 => '1 day remaining',
            default => $daysRemaining.' days remaining',
        };
    }

    /**
     * @return array<string, string>
     */
    private function statusLabels(): array
    {
        return [
            'expired' => 'Expired',
            'today' => 'Expires Today',
            'critical' => 'Critical',
            'upcoming' => 'Upcoming',
            'valid' => 'Valid',
            'missing' => 'Missing Date',
        ];
    }

    private function normalizeStatus(mixed $status): string
    {
        return in_array($status, [...self::STATUSES, 'all'], true) ? $status : 'all';
    }

    private function normalizePeriod(mixed $period): ?int
    {
        $period = is_numeric($period) ? (int) $period : null;

        return in_array($period, self::PERIODS, true) ? $period : null;
    }
}
