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
        Schema::table('members', function (Blueprint $table) {
            // Membership Fee
            $table->decimal('membership_fee', 15, 2)->nullable();
            $table->decimal('additional_membership_charges', 15, 2)->nullable();
            $table->string('membership_fee_additional_remarks')->nullable();
            $table->decimal('membership_fee_discount', 15, 2)->nullable();
            $table->string('membership_fee_discount_remarks')->nullable();
            $table->decimal('total_membership_fee', 15, 2)->nullable();

            // Maintenance Charges
            $table->decimal('maintenance_fee', 15, 2)->nullable();
            $table->decimal('additional_maintenance_charges', 15, 2)->nullable();
            $table->string('maintenance_fee_additional_remarks')->nullable();
            $table->decimal('maintenance_fee_discount', 15, 2)->nullable();
            $table->string('maintenance_fee_discount_remarks')->nullable();
            $table->decimal('total_maintenance_fee', 15, 2)->nullable();
            $table->decimal('per_day_maintenance_fee', 15, 2)->nullable();

            $table->text('comment_box')->nullable();  // General comments
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn([
                'membership_fee',
                'additional_membership_charges',
                'membership_fee_additional_remarks',
                'membership_fee_discount',
                'membership_fee_discount_remarks',
                'total_membership_fee',
                'maintenance_fee',
                'additional_maintenance_charges',
                'maintenance_fee_additional_remarks',
                'maintenance_fee_discount',
                'maintenance_fee_discount_remarks',
                'total_maintenance_fee',
                'per_day_maintenance_fee',
                'comment_box',
            ]);
        });
    }
};
