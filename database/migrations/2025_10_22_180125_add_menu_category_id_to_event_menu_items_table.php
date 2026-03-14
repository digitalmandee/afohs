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
        Schema::table('event_menu_items', function (Blueprint $table) {
            // Add menu_category_id foreign key column
            $table->unsignedBigInteger('menu_category_id')->nullable()->after('event_menu_id');
            
            // Add foreign key constraint
            $table->foreign('menu_category_id')
                  ->references('id')
                  ->on('event_menu_categories')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('event_menu_items', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['menu_category_id']);
            
            // Drop the column
            $table->dropColumn('menu_category_id');
        });
    }
};
