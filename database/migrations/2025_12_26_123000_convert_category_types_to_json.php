<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('member_categories', function (Blueprint $table) {
            // Add JSON column for category types
            if (!Schema::hasColumn('member_categories', 'category_types')) {
                $table->json('category_types')->nullable()->after('status');
            }
        });

        // Migrate existing boolean data to JSON
        $categories = DB::table('member_categories')->get();
        foreach ($categories as $category) {
            $types = [];
            if (isset($category->is_primary) && $category->is_primary) {
                $types[] = 'primary';
            }
            if (isset($category->is_corporate) && $category->is_corporate) {
                $types[] = 'corporate';
            }
            if (empty($types)) {
                $types[] = 'primary';  // Default
            }
            DB::table('member_categories')
                ->where('id', $category->id)
                ->update(['category_types' => json_encode($types)]);
        }

        // Drop old boolean columns
        Schema::table('member_categories', function (Blueprint $table) {
            if (Schema::hasColumn('member_categories', 'is_primary')) {
                $table->dropColumn('is_primary');
            }
            if (Schema::hasColumn('member_categories', 'is_corporate')) {
                $table->dropColumn('is_corporate');
            }
            if (Schema::hasColumn('member_categories', 'category_type')) {
                $table->dropColumn('category_type');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_categories', function (Blueprint $table) {
            if (Schema::hasColumn('member_categories', 'category_types')) {
                $table->dropColumn('category_types');
            }
        });
    }
};
