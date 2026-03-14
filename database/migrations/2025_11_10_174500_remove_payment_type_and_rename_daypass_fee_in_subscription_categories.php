<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subscription_categories', function (Blueprint $table) {
            // Remove payment_type and daypass_fee columns
            $table->dropColumn(['payment_type', 'daypass_fee']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_categories', function (Blueprint $table) {
            // Add back payment_type and daypass_fee columns
            $table->enum('payment_type', ['monthly', 'daypass'])->default('monthly')->after('fee');
            $table->decimal('daypass_fee', 10, 2)->nullable()->after('payment_type');
        });
    }
};
