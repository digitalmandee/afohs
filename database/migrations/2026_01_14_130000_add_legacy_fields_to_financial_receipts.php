<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('financial_receipts', function (Blueprint $table) {
            $table->decimal('advance_amount', 15, 2)->default(0)->nullable()->after('amount');
            $table->string('ntn')->nullable()->comment('ntn, cts, or null')->after('advance_amount');

            // Handle legacy_id: Change if exists (from old migration), else create
            if (Schema::hasColumn('financial_receipts', 'legacy_id')) {
                $table->unsignedBigInteger('legacy_id')->nullable()->change();
            } else {
                $table->unsignedBigInteger('legacy_id')->nullable()->index()->after('ntn');
            }

            // Handle employee_id: Change if exists, else create
            if (Schema::hasColumn('financial_receipts', 'employee_id')) {
                $table->unsignedBigInteger('employee_id')->nullable()->change();
            } else {
                $table->unsignedBigInteger('employee_id')->nullable()->index()->after('legacy_id');
            }

            // Add guest fields if missing
            if (!Schema::hasColumn('financial_receipts', 'guest_name')) {
                $table->string('guest_name')->nullable()->after('employee_id');
            }
            if (!Schema::hasColumn('financial_receipts', 'guest_contact')) {
                $table->string('guest_contact')->nullable()->after('guest_name');
            }
        });
    }

    public function down()
    {
        Schema::table('financial_receipts', function (Blueprint $table) {
            $table->dropColumn(['advance_amount', 'ntn', 'legacy_id', 'employee_id']);
        });
    }
};
