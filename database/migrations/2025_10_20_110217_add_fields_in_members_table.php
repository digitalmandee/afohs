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
        Schema::table('members', function (Blueprint $table) {
            $table->renameColumn('membership_reason', 'reason');
            $table->renameColumn('coa_account', 'coa_category_id');
            $table->enum('blood_group', ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])->nullable()->after('reason');
            $table->string('tel_number_a')->nullable()->after('blood_group');
            $table->string('tel_number_b')->nullable()->after('tel_number_a');
            $table->string('active_remarks')->nullable()->after('tel_number_b');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('blood_group');
            $table->dropColumn('tel_number_a');
            $table->dropColumn('tel_number_b');
        });
    }
};
