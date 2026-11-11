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
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('key', 50)->unique();
            $table->string('name');
            $table->string('type', 30)->index();
            $table->timestamps();
        });

        $roles = [
            ['key' => 'admin', 'name' => 'Admin', 'type' => 'admin'],
            ['key' => 'procurement', 'name' => 'Procurement', 'type' => 'procurement'],
            ['key' => 'supplier', 'name' => 'Supplier', 'type' => 'supplier'],
            ['key' => 'mep', 'name' => 'MEP', 'type' => 'department'],
            ['key' => 'it', 'name' => 'IT', 'type' => 'department'],
            ['key' => 'qaqc', 'name' => 'QAQC', 'type' => 'department'],
            ['key' => 'marketing', 'name' => 'Marketing', 'type' => 'department'],
            ['key' => 'pe', 'name' => 'P&E', 'type' => 'department'],
            ['key' => 'design', 'name' => 'Design', 'type' => 'department'],
            ['key' => 'finance', 'name' => 'Finance', 'type' => 'department'],
            ['key' => 'commercial', 'name' => 'Commercial', 'type' => 'department'],
            ['key' => 'hse', 'name' => 'HSE', 'type' => 'department'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->insert([
                ...$role,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 50)->default('supplier')->change();
        });

        DB::table('users')->where('role', 'superadmin')->update(['role' => 'admin']);

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role')->references('key')->on('roles')->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('users')->whereNotIn('role', ['admin', 'procurement', 'supplier'])->exists()) {
            throw new RuntimeException('Cannot remove department roles while users are assigned to them.');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role']);
            $table->enum('role', ['admin', 'procurement', 'supplier'])->default('supplier')->change();
        });

        Schema::dropIfExists('roles');
    }
};
