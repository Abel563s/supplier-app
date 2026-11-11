<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('supplier_department_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('department', 50);
            $table->foreign('department')->references('key')->on('roles')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('assigned');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->unique(['supplier_id', 'department']);
            $table->index(['department', 'status']);
        });

        DB::table('suppliers')
            ->whereNotNull('approval_department')
            ->orderBy('id')
            ->chunkById(100, function ($suppliers): void {
                foreach ($suppliers as $supplier) {
                    DB::table('supplier_department_reviews')->insertOrIgnore([
                        'supplier_id' => $supplier->id,
                        'department' => $supplier->approval_department,
                        'assigned_by' => $supplier->department_assigned_by,
                        'assigned_at' => $supplier->department_assigned_at,
                        'status' => $supplier->department_review_status ?? 'assigned',
                        'created_at' => $supplier->department_assigned_at ?? now(),
                        'updated_at' => $supplier->department_assigned_at ?? now(),
                    ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_department_reviews');
    }
};
