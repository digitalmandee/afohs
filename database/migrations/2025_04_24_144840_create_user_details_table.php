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
        Schema::create('user_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Optional personal fields
            $table->string('coa_account')->nullable();
            $table->string('title')->nullable(); // e.g., Mr., Mrs., Dr.
            $table->string('state')->nullable();

            // Application details
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

            // Contact Info
            $table->string('mobile_number_a')->nullable();
            $table->string('mobile_number_b')->nullable();
            $table->string('mobile_number_c')->nullable();
            $table->string('telephone_number')->nullable();
            $table->string('personal_email')->nullable();
            $table->string('critical_email')->nullable();

            // Emergency contact
            $table->string('emergency_name')->nullable();
            $table->string('emergency_relation')->nullable();
            $table->string('emergency_contact')->nullable();

            // Current address
            $table->string('current_address')->nullable();
            $table->string('current_city')->nullable();
            $table->string('current_country')->nullable();

            // Permanent address
            $table->string('permanent_address')->nullable();
            $table->string('permanent_city')->nullable();
            $table->string('permanent_country')->nullable();

            // General address info
            $table->string('address_type')->nullable();
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('zip')->nullable();
            $table->string('address')->nullable();

            // Profile
            $table->enum('status', ['active', 'inactive'])->default('inactive');
            $table->string('profile_picture')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_details');
    }
};