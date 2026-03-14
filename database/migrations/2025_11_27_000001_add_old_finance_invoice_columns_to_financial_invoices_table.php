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
            // Customer information fields from old table (using short names)
            $table->string('name')->nullable()->after('customer_id');
            $table->string('mem_no')->nullable()->after('name');
            $table->text('address')->nullable()->after('mem_no');
            $table->string('contact')->nullable()->after('address');
            $table->string('cnic')->nullable()->after('contact');
            $table->string('email')->nullable()->after('cnic');

            // Family ID
            $table->unsignedBigInteger('family_id')->nullable()->after('email');

            // Tax and discount details
            $table->text('extra_details')->nullable()->after('discount_details');
            $table->decimal('tax_amount', 10, 2)->nullable()->after('extra_details');
            $table->text('tax_details')->nullable()->after('tax_amount');
            $table->decimal('discount_percentage', 5, 2)->nullable()->after('discount_value');
            $table->decimal('extra_percentage', 5, 2)->nullable()->after('discount_percentage');
            $table->decimal('tax_percentage', 5, 2)->nullable()->after('extra_percentage');

            // Additional charges
            $table->string('charges_type')->nullable()->after('customer_charges');
            $table->decimal('charges_amount', 10, 2)->nullable()->after('charges_type');

            // Calculation and quantity fields
            $table->integer('number_of_days')->nullable()->after('period_end');
            $table->integer('quantity')->nullable()->after('number_of_days');
            $table->decimal('sub_total', 10, 2)->nullable()->after('amount');
            $table->decimal('per_day_amount', 10, 2)->nullable()->after('sub_total');
            $table->decimal('ledger_amount', 10, 2)->nullable()->after('per_day_amount');

            // Metadata and accounting
            $table->boolean('is_auto_generated')->default(false)->after('status');
            $table->string('amount_in_words')->nullable()->after('is_auto_generated');
            $table->string('coa_code')->nullable()->after('amount_in_words');
            $table->unsignedBigInteger('corporate_id')->nullable()->after('coa_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'mem_no',
                'address',
                'contact',
                'cnic',
                'email',
                'family_id',
                'extra_details',
                'tax_amount',
                'tax_details',
                'discount_percentage',
                'extra_percentage',
                'tax_percentage',
                'charges_type',
                'charges_amount',
                'number_of_days',
                'quantity',
                'sub_total',
                'per_day_amount',
                'ledger_amount',
                'is_auto_generated',
                'amount_in_words',
                'coa_code',
                'corporate_id',
            ]);
        });
    }
};
