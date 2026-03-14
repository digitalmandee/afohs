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
        Schema::table('employees', function (Blueprint $table) {
            // Basic new fields
            $table->string('nationality', 100)->nullable()->after('national_id');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('nationality');
            $table->enum('payment_method', ['cash', 'bank'])->default('bank')->after('account_no');

            // Contract dates (for contract-based employees)
            $table->date('contract_start_date')->nullable()->after('joining_date');
            $table->date('contract_end_date')->nullable()->after('contract_start_date');

            // Academic Information
            $table->string('academic_qualification', 255)->nullable()->after('remarks');
            $table->string('academic_institution', 255)->nullable()->after('academic_qualification');
            $table->string('academic_year', 10)->nullable()->after('academic_institution');

            // Work Experience
            $table->integer('work_experience_years')->nullable()->after('academic_year');
            $table->string('previous_employer', 255)->nullable()->after('work_experience_years');
            $table->string('previous_position', 255)->nullable()->after('previous_employer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'nationality',
                'status',
                'payment_method',
                'contract_start_date',
                'contract_end_date',
                'academic_qualification',
                'academic_institution',
                'academic_year',
                'work_experience_years',
                'previous_employer',
                'previous_position',
            ]);
        });
    }
};
