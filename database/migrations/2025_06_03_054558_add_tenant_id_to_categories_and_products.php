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
        Schema::table('categories', function (Blueprint $table) {
            $table->string('tenant_id')->nullable();
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('tenant_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
        });
    }
};