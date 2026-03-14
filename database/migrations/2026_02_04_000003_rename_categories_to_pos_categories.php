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
        // 1. Drop Foreign Keys referencing 'categories'
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        // 2. Rename the table
        Schema::rename('categories', 'pos_categories');

        // 3. Re-add Foreign Keys referencing 'pos_categories'
        Schema::table('products', function (Blueprint $table) {
            $table
                ->foreign('category_id')
                ->references('id')
                ->on('pos_categories')
                ->nullOnDelete();
        });

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            $table
                ->foreign('category_id')
                ->references('id')
                ->on('pos_categories')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop Foreign Keys referencing 'pos_categories'
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
        });

        // 2. Rename the table back
        Schema::rename('pos_categories', 'categories');

        // 3. Re-add Foreign Keys referencing 'categories'
        Schema::table('products', function (Blueprint $table) {
            $table
                ->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->nullOnDelete();
        });

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            $table
                ->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->onDelete('cascade');
        });
    }
};
