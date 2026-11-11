<?php

namespace App\Console\Commands;

use App\Models\ProcurementRequest;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteSeededData extends Command
{
    protected $signature = 'data:delete-seeded {--force : Delete without confirmation}';

    protected $description = 'Delete all seeded suppliers and procurement requests';

    public function handle(): void
    {
        if (! $this->option('force') && ! $this->confirm('This will permanently delete all suppliers, procurement requests, and associated factory-created users. Are you sure?', false)) {
            $this->info('Operation cancelled.');

            return;
        }

        DB::transaction(function () {
            Supplier::query()->delete();
            ProcurementRequest::query()->delete();
            User::whereIn('role', ['supplier', 'procurement'])->delete();
        });

        $this->info('All seeded data deleted successfully.');
    }
}
