<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_vouchers', function (Blueprint $table) {
            if (!Schema::hasColumn('accounting_vouchers', 'payment_rows')) {
                $table->json('payment_rows')->nullable()->after('amount');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accounting_vouchers', function (Blueprint $table) {
            if (Schema::hasColumn('accounting_vouchers', 'payment_rows')) {
                $table->dropColumn('payment_rows');
            }
        });
    }
};

