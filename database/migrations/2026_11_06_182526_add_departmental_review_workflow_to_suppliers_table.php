<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('suppliers', function (Blueprint $table) {
            $table->string('approval_department', 50)->nullable()->after('status');
            $table->string('approval_stage', 40)->default('admin_review')->after('approval_department');
            $table->string('department_review_status', 40)->nullable()->after('approval_stage');
            $table->foreignId('department_assigned_by')->nullable()->after('department_review_status')->constrained('users')->nullOnDelete();
            $table->timestamp('department_assigned_at')->nullable()->after('department_assigned_by');
            $table->foreign('approval_department')->references('key')->on('roles')->nullOnDelete()->cascadeOnUpdate();
            $table->index(['approval_department', 'approval_stage']);
        });

        Schema::create('supplier_review_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            $table->string('event_type', 40);
            $table->string('department', 50)->nullable();
            $table->foreign('department')->references('key')->on('roles')->nullOnDelete()->cascadeOnUpdate();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('grade_snapshot')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index(['supplier_id', 'event_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_review_histories');

        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropForeign(['approval_department']);
            $table->dropForeign(['department_assigned_by']);
            $table->dropIndex(['approval_department', 'approval_stage']);
            $table->dropColumn([
                'approval_department',
                'approval_stage',
                'department_review_status',
                'department_assigned_by',
                'department_assigned_at',
            ]);
        });
    }
};
