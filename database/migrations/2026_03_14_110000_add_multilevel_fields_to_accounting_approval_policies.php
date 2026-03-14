<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_approval_policies', function (Blueprint $table) {
            $table->string('level1_role')->nullable()->after('approver_role');
            $table->decimal('level1_max_amount', 14, 2)->nullable()->after('level1_role');
            $table->string('level2_role')->nullable()->after('level1_max_amount');
        });
    }

    public function down(): void
    {
        Schema::table('accounting_approval_policies', function (Blueprint $table) {
            $table->dropColumn(['level1_role', 'level1_max_amount', 'level2_role']);
        });
    }
};

