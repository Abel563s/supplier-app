<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class TaxExpiryController extends Controller
{
    /**
     * Ordered status buckets used for filtering and summary totals.
     *
     * @var array<int, string>
     */
    private const STATUSES = ['expired', 'today', 'critical', 'upcoming', 'valid', 'missing'];

    /**
     * Supported sort keys.
     *
     * @var array<int, string>
     */
    private const SORTS = ['expiry_asc', 'expiry_desc', 'days_asc', 'days_desc'];

    /**
     * Cumulative expiry-period windows in days, including today.
     *
     * @var array<int, int>
     */
    private const PERIODS = [7, 30, 90];

    private const DEFAULT_SORT = 'expiry_asc';

    public function index(Request $request)
    {
        $today = Carbon::today();

        $filters = [
            'search' => $request->string('search')->trim()->toString(),
            'status' => $this->normalizeStatus($request->input('status')),
            'period' => $this->normalizePeriod($request->input('period')),
            'sort' => $this->normalizeSort($request->input('sort')),
        ];

        $baseQuery = $this->approvedSupplierQuery($filters['search']);

        $summary = $this->buildSummary($baseQuery, $today);

        $suppliers = $this->buildSupplierQuery($baseQuery, $filters, $today)
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Supplier $supplier): array => $this->transformSupplier($supplier, $today));

        return Inertia::render('admin/tax-expiry/index', [
            'suppliers' => $suppliers,
            'summary' => $summary,
            'filters' => $filters,
            'today' => $today->toDateString(),
        ]);
    }

    /**
     * Base query limited to approved suppliers, narrowed by the optional search term.
     */
    private function approvedSupplierQuery(string $search): Builder
    {
        return Supplier::query()
            ->where('status', 'approved')
            ->when(
                $search !== '',
                fn ($query) => $query->where(
                    fn ($query) => $query
                        ->where('legal_name', 'like', '%'.$search.'%')
                        ->orWhere('tin', 'like', '%'.$search.'%')
                )
            );
    }

    /**
     * Count every status bucket so the summary always matches the underlying records.
     *
     * @return array{approved: int, expired: int, today: int, critical: int, upcoming: int, valid: int, missing: int, expiring_in_7_days: int, expiring_in_30_days: int}
     */
    private function buildSummary(Builder $baseQuery, Carbon $today): array
    {
        $rows = (clone $baseQuery)
            ->reorder()
            ->selectRaw('tax_clearance_to, COUNT(*) as aggregate')
            ->groupBy('tax_clearance_to')
            ->get();

        $summary = [
            'approved' => 0,
            'expired' => 0,
            'today' => 0,
            'critical' => 0,
            'upcoming' => 0,
            'valid' => 0,
            'missing' => 0,
            'expiring_in_7_days' => 0,
            'expiring_in_30_days' => 0,
        ];

        foreach ($rows as $row) {
            $count = (int) $row->aggregate;

            $summary['approved'] += $count;

            if ($row->tax_clearance_to === null) {
                $summary['missing'] += $count;

                continue;
            }

            $daysRemaining = $this->daysRemaining($row->tax_clearance_to, $today);

            match (true) {
                $daysRemaining < 0 => $summary['expired'] += $count,
                $daysRemaining === 0 => $summary['today'] += $count,
                $daysRemaining <= 7 => $summary['critical'] += $count,
                $daysRemaining <= 30 => $summary['upcoming'] += $count,
                default => $summary['valid'] += $count,
            };

            if ($daysRemaining >= 0 && $daysRemaining <= 7) {
                $summary['expiring_in_7_days'] += $count;
            }

            if ($daysRemaining >= 0 && $daysRemaining <= 30) {
                $summary['expiring_in_30_days'] += $count;
            }
        }

        return $summary;
    }

    /**
     * Apply the active status filter and sort ordering before pagination.
     */
    private function buildSupplierQuery(
        Builder $baseQuery,
        array $filters,
        Carbon $today,
    ): Builder {
        $query = (clone $baseQuery)->select([
            'id',
            'legal_name',
            'trade_name',
            'tin',
            'business_registration_no',
            'primary_contact_name',
            'primary_phone',
            'tax_clearance_to',
        ]);

        $status = $filters['status'];

        if ($status === 'missing') {
            $query->whereNull('tax_clearance_to');
        } elseif ($status !== 'all') {
            $query->whereNotNull('tax_clearance_to');

            match ($status) {
                'expired' => $query->whereDate('tax_clearance_to', '<', $today),
                'today' => $query->whereDate('tax_clearance_to', '=', $today),
                'critical' => $query->whereBetween('tax_clearance_to', [
                    $today->copy()->addDay()->toDateString(),
                    $today->copy()->addDays(7)->toDateString(),
                ]),
                'upcoming' => $query->whereBetween('tax_clearance_to', [
                    $today->copy()->addDays(8)->toDateString(),
                    $today->copy()->addDays(30)->toDateString(),
                ]),
                'valid' => $query->whereDate('tax_clearance_to', '>', $today->copy()->addDays(30)),
            };
        }

        if ($filters['period'] !== null) {
            $query->whereNotNull('tax_clearance_to')->whereBetween('tax_clearance_to', [
                $today->toDateString(),
                $today->copy()->addDays($filters['period'])->toDateString(),
            ]);
        }

        $direction = str_ends_with($filters['sort'], '_desc') ? 'desc' : 'asc';

        return $query
            ->orderByRaw('tax_clearance_to IS NULL')
            ->orderBy('tax_clearance_to', $direction)
            ->orderBy('legal_name');
    }

    /**
     * @return array{name: string, tin: string, business_registration_no: string, contact_name: string, contact_phone: string, expiry_date: string|null, days_remaining: int|null, status: string, status_label: string, time_remaining: string}
     */
    private function transformSupplier(Supplier $supplier, Carbon $today): array
    {
        $expiryDate = $supplier->tax_clearance_to;

        if ($expiryDate === null) {
            return [
                'name' => $supplier->legal_name,
                'trade_name' => $supplier->trade_name,
                'tin' => $supplier->tin,
                'business_registration_no' => $supplier->business_registration_no,
                'contact_name' => $supplier->primary_contact_name,
                'contact_phone' => $supplier->primary_phone,
                'expiry_date' => null,
                'days_remaining' => null,
                'status' => 'missing',
                'status_label' => 'Missing Date',
                'time_remaining' => 'No tax expiry date submitted',
            ];
        }

        $daysRemaining = $this->daysRemaining($expiryDate, $today);
        $status = $this->statusFor($daysRemaining);

        return [
            'name' => $supplier->legal_name,
            'trade_name' => $supplier->trade_name,
            'tin' => $supplier->tin,
            'business_registration_no' => $supplier->business_registration_no,
            'contact_name' => $supplier->primary_contact_name,
            'contact_phone' => $supplier->primary_phone,
            'expiry_date' => Carbon::parse($expiryDate)->toDateString(),
            'days_remaining' => $daysRemaining,
            'status' => $status,
            'status_label' => $this->statusLabels()[$status],
            'time_remaining' => $this->humanizeDaysRemaining($daysRemaining),
        ];
    }

    /**
     * Signed calendar days between today and the expiry date.
     */
    private function daysRemaining(string|\DateTimeInterface $expiryDate, Carbon $today): int
    {
        $expiry = Carbon::parse($expiryDate)->startOfDay();

        return (int) $today->startOfDay()->diffInDays($expiry, false);
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

    private function humanizeDaysRemaining(int $daysRemaining): string
    {
        return match (true) {
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

    private function normalizeSort(mixed $sort): string
    {
        return in_array($sort, self::SORTS, true) ? $sort : self::DEFAULT_SORT;
    }

    private function normalizePeriod(mixed $period): ?int
    {
        $period = is_numeric($period) ? (int) $period : null;

        return in_array($period, self::PERIODS, true) ? $period : null;
    }
}
