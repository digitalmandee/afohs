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
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->decimal('default_amount', 10, 2)->nullable()->after('name');
            $table->boolean('is_fixed')->default(false)->after('default_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->dropColumn(['default_amount', 'is_fixed']);
        });
    }
};
