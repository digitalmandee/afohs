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
            // Add polymorphic relationship columns
            $table->unsignedBigInteger('invoiceable_id')->nullable()->after('member_id');
            $table->string('invoiceable_type')->nullable()->after('invoiceable_id');
            
            // Add index for better query performance
            $table->index(['invoiceable_id', 'invoiceable_type'], 'invoiceable_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropIndex('invoiceable_index');
            $table->dropColumn(['invoiceable_id', 'invoiceable_type']);
        });
    }
};
