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
        Schema::table('order_items', function (Blueprint $table) {
            // If kitchen_id was a foreign key, drop constraint first
            if (Schema::hasColumn('order_items', 'kitchen_id')) {
                $table->dropForeign(['kitchen_id']);
                $table->dropColumn('kitchen_id');
            }

            $table->string('tenant_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });
    }
};
