<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('financial_invoices', 'tax_amount')) {
                $table->decimal('tax_amount', 15, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('financial_invoices', 'discount_amount')) {
                $table->decimal('discount_amount', 15, 2)->default(0)->after('tax_amount');
            }
            if (!Schema::hasColumn('financial_invoices', 'paid_amount')) {
                $table->decimal('paid_amount', 15, 2)->default(0)->after('total_price');  // Adding paid_amount just in case, good for tracking
            }
        });
    }

    public function down()
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn(['tax_amount', 'discount_amount', 'paid_amount']);
        });
    }
};
