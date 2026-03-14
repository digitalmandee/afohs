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
        Schema::table('applied_member', function (Blueprint $table) {
            if (!Schema::hasColumn('applied_member', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('member_categories', function (Blueprint $table) {
            if (!Schema::hasColumn('member_categories', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('member_types', function (Blueprint $table) {
            if (!Schema::hasColumn('member_types', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('applied_member', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('member_categories', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('member_types', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
