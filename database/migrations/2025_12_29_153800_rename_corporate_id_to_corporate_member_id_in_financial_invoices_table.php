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
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Drop duplicate column if exists (from previous migration)
            if (Schema::hasColumn('financial_invoices', 'corporate_member_id')) {
                $table->dropColumn('corporate_member_id');
            }
        });

        Schema::table('financial_invoices', function (Blueprint $table) {
            // Rename legacy column to the standard name
            $table->renameColumn('corporate_id', 'corporate_member_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->renameColumn('corporate_member_id', 'corporate_id');
            $table->unsignedBigInteger('corporate_member_id')->nullable()->after('member_id');
        });
    }
};
