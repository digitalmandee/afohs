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
        Schema::table('financial_receipts', function (Blueprint $table) {
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('employee_id')->nullable()->after('created_by')->comment('Legacy Employee ID (e.g. from finance_cash_receipts)');
            $table->string('guest_name')->nullable()->after('payer_id');
            $table->string('guest_contact')->nullable()->after('guest_name');
            $table->string('legacy_id')->nullable()->after('id')->index();  // To store original ID if needed, though ID is preserved
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_receipts', function (Blueprint $table) {
            $table->dropColumn(['employee_id', 'guest_name', 'guest_contact', 'legacy_id']);
        });
    }
};
