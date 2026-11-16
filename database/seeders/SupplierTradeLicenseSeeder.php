<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SupplierTradeLicenseSeeder extends Seeder
{
    /**
     * Calendar types to assign (weighted toward gregorian for backward compatibility).
     *
     * @var array<string, float>
     */
    private const CALENDAR_TYPES = [
        'gregorian' => 0.7,
        'ethiopian' => 0.3,
    ];

    public function run(): void
    {
        $today = Carbon::today();

        Supplier::query()
            ->whereNull('trade_license_calendar_type')
            ->orWhereNull('trade_license_renewed_date')
            ->orderBy('id')
            ->chunkById(100, function ($suppliers) {
                foreach ($suppliers as $supplier) {
                    $calendarType = $this->randomCalendarType();
                    $renewedDate = $supplier->trade_license_renewed_date ?? $this->randomRenewedDate();

                    $updateData = [
                        'trade_license_calendar_type' => $supplier->trade_license_calendar_type ?? $calendarType,
                        'trade_license_renewed_date' => $supplier->trade_license_renewed_date ?? $renewedDate,
                    ];

                    // Store the original calendar-specific date when calendar type is ethiopian
                    if ($calendarType === 'ethiopian' && $renewedDate) {
                        $ethiopian = \App\Utils\EthiopianCalendar::gregorianToEthiopian(
                            (int) $renewedDate->format('Y'),
                            (int) $renewedDate->format('m'),
                            (int) $renewedDate->format('d')
                        );
                        $updateData['trade_license_date_original'] = $ethiopian['year'] . '-' . str_pad($ethiopian['month'], 2, '0', STR_PAD_LEFT) . '-' . str_pad($ethiopian['day'], 2, '0', STR_PAD_LEFT);
                    } elseif ($calendarType === 'gregorian') {
                        $updateData['trade_license_date_original'] = $supplier->trade_license_date_original ?? $renewedDate->format('Y-m-d');
                    }

                    $supplier->forceFill($updateData)->save();
                }
            });
    }

    private function randomCalendarType(): string
    {
        $rand = fake()->randomFloat(2, 0, 1);
        $cumulative = 0.0;

        foreach (self::CALENDAR_TYPES as $type => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $type;
            }
        }

        return 'gregorian';
    }

    private function randomRenewedDate(): \Carbon\Carbon
    {
        return fake()->dateTimeBetween('-1 year', '+2 years');
    }
}
