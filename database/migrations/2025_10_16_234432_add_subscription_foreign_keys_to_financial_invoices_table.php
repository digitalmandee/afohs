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
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Add subscription foreign key columns
            $table->unsignedBigInteger('subscription_type_id')->nullable()->after('fee_type');
            $table->unsignedBigInteger('subscription_category_id')->nullable()->after('subscription_type_id');
            
            // Add foreign key constraints
            $table->foreign('subscription_type_id')->references('id')->on('subscription_types')->onDelete('set null');
            $table->foreign('subscription_category_id')->references('id')->on('subscription_categories')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Drop foreign key constraints first
            $table->dropForeign(['subscription_type_id']);
            $table->dropForeign(['subscription_category_id']);
            
            // Drop columns
            $table->dropColumn(['subscription_type_id', 'subscription_category_id']);
        });
    }
};
