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
        Schema::table('partners_affiliates', function (Blueprint $table) {
            $table->date('agreement_end_date')->nullable()->after('agreement_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners_affiliates', function (Blueprint $table) {
            $table->dropColumn('agreement_end_date');
        });
    }
};
