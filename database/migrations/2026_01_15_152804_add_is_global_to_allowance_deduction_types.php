<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('allowance_types', function (Blueprint $table) {
            if (!Schema::hasColumn('allowance_types', 'is_global')) {
                $table->boolean('is_global')->default(false)->after('is_active');
            }
        });

        Schema::table('deduction_types', function (Blueprint $table) {
            if (!Schema::hasColumn('deduction_types', 'is_global')) {
                $table->boolean('is_global')->default(false)->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('allowance_types', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });

        Schema::table('deduction_types', function (Blueprint $table) {
            $table->dropColumn('is_global');
        });
    }
};
