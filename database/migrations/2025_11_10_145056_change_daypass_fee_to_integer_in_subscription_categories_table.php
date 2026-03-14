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
            // Change daypass_fee from decimal to integer
            $table->integer('daypass_fee')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_categories', function (Blueprint $table) {
            // Revert back to decimal
            $table->decimal('daypass_fee', 10, 2)->nullable()->change();
        });
    }
};
