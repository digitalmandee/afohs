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
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('service_charges', 10, 2)->nullable()->default(0);
            $table->decimal('service_charges_percentage', 5, 2)->nullable()->default(0);
            $table->decimal('bank_charges', 10, 2)->nullable()->default(0);
            $table->decimal('bank_charges_percentage', 5, 2)->nullable()->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['service_charges', 'service_charges_percentage', 'bank_charges', 'bank_charges_percentage']);
        });
    }
};
