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
        Schema::table('corporate_members', function (Blueprint $table) {
            $table->foreignId('corporate_company_id')->nullable()->after('member_category_id')->constrained('corporate_companies')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('corporate_members', function (Blueprint $table) {
            $table->dropForeign(['corporate_company_id']);
            $table->dropColumn('corporate_company_id');
        });
    }
};
