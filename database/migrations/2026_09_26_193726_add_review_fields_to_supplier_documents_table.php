<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_documents', function (Blueprint $table) {
            $table->enum('review_status', ['pending', 'verified', 'rejected', 'replacement_required', 'not_applicable'])->default('pending')->after('uploaded_at');
            $table->text('review_notes')->nullable()->after('review_status');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete()->after('review_notes');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_documents', function (Blueprint $table) {
            $table->dropColumn(['review_status', 'review_notes', 'reviewed_by', 'reviewed_at']);
        });
    }
};
