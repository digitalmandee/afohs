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
        Schema::table('members', function (Blueprint $table) {
            // Add new fields
            $table->string('coa_account')->nullable();
            $table->string('title')->nullable();
            $table->string('state')->nullable();
            $table->string('application_number')->nullable();
            $table->text('name_comments')->nullable();
            $table->string('guardian_name')->nullable();
            $table->string('guardian_membership')->nullable();
            $table->string('nationality')->nullable();
            $table->string('cnic_no')->nullable();
            $table->string('passport_no')->nullable();
            $table->string('gender')->nullable();
            $table->string('ntn')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->json('education')->nullable();
            $table->text('membership_reason')->nullable();
            $table->string('mobile_number_a')->nullable();
            $table->string('mobile_number_b')->nullable();
            $table->string('mobile_number_c')->nullable();
            $table->string('telephone_number')->nullable();
            $table->string('personal_email')->nullable();
            $table->string('critical_email')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_relation')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('current_address')->nullable();
            $table->string('current_city')->nullable();
            $table->string('current_country')->nullable();
            $table->string('permanent_address')->nullable();
            $table->string('permanent_city')->nullable();
            $table->string('permanent_country')->nullable();
            $table->string('address_type')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('zip')->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended', 'cancelled', 'pause'])->default('inactive')->nullable();
            $table->string('profile_picture')->nullable();
            $table->json('documents')->nullable();
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE members MODIFY COLUMN card_status VARCHAR(50) NULL');

            DB::table('members')
                ->whereNotIn('card_status', [
                    'In-Process', 'Printed', 'Received', 'Issued', 'Applied', 'Re-Printed', 'Not Applied', 'Expired', 'Not Applicable', 'E-Card Issued'
                ])
                ->update(['card_status' => 'In-Process']);

            DB::statement("ALTER TABLE members MODIFY COLUMN card_status ENUM('In-Process','Printed','Received','Issued','Re-Printed','E-Card Issued') NULL DEFAULT 'In-Process'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE members MODIFY COLUMN card_status VARCHAR(50) NULL');

            DB::table('members')
                ->whereNotIn('card_status', [
                    'active', 'inactive', 'suspended', 'cancelled', 'pause'
                ])
                ->update(['card_status' => 'inactive']);

            DB::statement("ALTER TABLE members MODIFY COLUMN card_status ENUM('active', 'inactive', 'suspended', 'cancelled', 'pause') NULL DEFAULT 'inactive'");
        }

        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn([
                'coa_account',
                'title',
                'state',
                'application_number',
                'name_comments',
                'guardian_name',
                'guardian_membership',
                'nationality',
                'cnic_no',
                'passport_no',
                'gender',
                'ntn',
                'date_of_birth',
                'education',
                'membership_reason',
                'mobile_number_a',
                'mobile_number_b',
                'mobile_number_c',
                'telephone_number',
                'personal_email',
                'critical_email',
                'emergency_name',
                'emergency_relation',
                'emergency_contact',
                'current_address',
                'current_city',
                'current_country',
                'permanent_address',
                'permanent_city',
                'permanent_country',
                'address_type',
                'country',
                'city',
                'zip',
                'address',
                'status',
                'profile_picture',
                'documents',
            ]);
        });
    }
};
