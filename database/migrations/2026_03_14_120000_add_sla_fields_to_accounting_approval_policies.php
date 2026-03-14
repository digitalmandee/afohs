<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_approval_policies', function (Blueprint $table) {
            $table->unsignedInteger('sla_hours')->nullable()->after('level2_role');
            $table->string('escalation_role')->nullable()->after('sla_hours');
        });
    }

    public function down(): void
    {
        Schema::table('accounting_approval_policies', function (Blueprint $table) {
            $table->dropColumn(['sla_hours', 'escalation_role']);
        });
    }
};

