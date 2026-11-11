<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SupplierTaxClearanceSeeder extends Seeder
{
    /**
     * Days from today used for each supplier's tax clearance expiry, cycling through
     * the list so seeded data covers every expiry status the monitoring page tracks.
     *
     * @var array<int, int|null>
     */
    private const EXPIRY_OFFSETS = [
        -75,
        -40,
        -12,
        -2,
        0,
        1,
        4,
        7,
        8,
        14,
        25,
        30,
        45,
        60,
        90,
        200,
        3,
        120,
        10,
        -30,
        5,
        21,
        150,
    ];

    public function run(): void
    {
        $today = Carbon::today();

        Supplier::query()
            ->whereNull('tax_clearance_from')
            ->whereNull('tax_clearance_to')
            ->orderBy('id')
            ->chunkById(100, function ($suppliers) use ($today) {
                foreach ($suppliers as $index => $supplier) {
                    $offset = self::EXPIRY_OFFSETS[$index % count(self::EXPIRY_OFFSETS)];

                    if ($offset === null) {
                        continue;
                    }

                    $expiryTo = $today->copy()->addDays($offset);
                    $expiryFrom = $expiryTo->copy()->subDays(365);

                    $supplier->forceFill([
                        'tax_clearance_from' => $expiryFrom,
                        'tax_clearance_to' => $expiryTo,
                        'tax_clearance_expiry' => $expiryTo,
                        'tax_clearance_fiscal_year' => $expiryTo->year,
                    ])->save();
                }
            });
    }
}
