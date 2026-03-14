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
            if (!Schema::hasColumn('allowance_types', 'default_amount')) {
                $table->decimal('default_amount', 10, 2)->nullable()->after('is_global');
            }
            if (!Schema::hasColumn('allowance_types', 'percentage')) {
                $table->decimal('percentage', 5, 2)->nullable()->after('default_amount');
            }
        });

        Schema::table('deduction_types', function (Blueprint $table) {
            if (!Schema::hasColumn('deduction_types', 'default_amount')) {
                $table->decimal('default_amount', 10, 2)->nullable()->after('is_global');
            }
            if (!Schema::hasColumn('deduction_types', 'percentage')) {
                $table->decimal('percentage', 5, 2)->nullable()->after('default_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('allowance_types', function (Blueprint $table) {
            $table->dropColumn(['default_amount', 'percentage']);
        });

        Schema::table('deduction_types', function (Blueprint $table) {
            $table->dropColumn(['default_amount', 'percentage']);
        });
    }
};
