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
            // Personal Information
            $table->string('father_name')->nullable()->after('name');
            $table->string('age')->nullable()->after('gender');
            $table->string('application_no')->nullable()->after('employee_id');

            // Contact Information (additional)
            $table->string('mob_b')->nullable()->after('phone_no');  // Secondary mobile
            $table->string('tel_a')->nullable()->after('mob_b');  // Primary telephone
            $table->string('tel_b')->nullable()->after('tel_a');  // Secondary telephone

            // Current Address Details
            $table->string('cur_city')->nullable()->after('address');
            $table->string('cur_country')->nullable()->after('cur_city');

            // Permanent Address Details
            $table->string('per_address')->nullable()->after('cur_country');
            $table->string('per_city')->nullable()->after('per_address');
            $table->string('per_country')->nullable()->after('per_city');

            // License Information
            $table->string('license')->nullable()->after('per_country');  // Yes/No
            $table->string('license_no')->nullable()->after('license');

            // Vehicle and Bank Details
            $table->string('vehicle_details')->nullable()->after('license_no');
            $table->string('bank_details')->nullable()->after('vehicle_details');

            // Organizational Information
            $table->string('learn_of_org')->nullable()->after('bank_details');
            $table->string('anyone_in_org')->nullable()->after('learn_of_org');
            $table->string('company')->nullable()->after('anyone_in_org');

            // Criminal Background
            $table->string('crime')->nullable()->after('company');  // Yes/No
            $table->text('crime_details')->nullable()->after('crime');

            // Additional Information
            $table->text('remarks')->nullable()->after('crime_details');
            $table->string('barcode')->nullable()->after('remarks');
            $table->text('picture')->nullable()->after('barcode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'father_name',
                'age',
                'application_no',
                'mob_b',
                'tel_a',
                'tel_b',
                'cur_city',
                'cur_country',
                'per_address',
                'per_city',
                'per_country',
                'license',
                'license_no',
                'vehicle_details',
                'bank_details',
                'learn_of_org',
                'anyone_in_org',
                'company',
                'crime',
                'crime_details',
                'remarks',
                'barcode',
                'picture',
            ]);
        });
    }
};
