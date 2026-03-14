<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Creates corporate_members table with same structure as members table
     */
    public function up(): void
    {
        Schema::create('corporate_members', function (Blueprint $table) {
            $table->id();

            // Legacy/Old IDs
            $table->string('old_family_id')->nullable();
            $table->string('old_member_id')->nullable();

            // Identification
            $table->string('barcode_no')->nullable();
            $table->string('membership_no')->nullable()->unique();

            // Foreign Keys
            $table->foreignId('member_category_id')->nullable()->constrained('member_categories')->onDelete('set null');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('family_suffix')->nullable();
            $table->string('kinship')->nullable();

            // Personal Info
            $table->string('title')->nullable();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('full_name')->nullable();
            $table->string('relation')->nullable();
            $table->string('martial_status')->nullable();
            $table->string('gender')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('education')->nullable();
            $table->string('nationality')->nullable();

            // Identification Documents
            $table->string('cnic_no')->nullable();
            $table->string('passport_no')->nullable();
            $table->string('ntn')->nullable();

            // Contact Info
            $table->string('phone_number')->nullable();
            $table->string('tel_number_a')->nullable();
            $table->string('tel_number_b')->nullable();
            $table->string('mobile_number_a')->nullable();
            $table->string('mobile_number_b')->nullable();
            $table->string('mobile_number_c')->nullable();
            $table->string('telephone_number')->nullable();
            $table->string('personal_email')->nullable();
            $table->string('critical_email')->nullable();

            // Emergency Contact
            $table->string('emergency_name')->nullable();
            $table->string('emergency_relation')->nullable();
            $table->string('emergency_contact')->nullable();

            // Address - Current
            $table->text('current_address')->nullable();
            $table->string('current_city')->nullable();
            $table->string('current_country')->nullable();

            // Address - Permanent
            $table->text('permanent_address')->nullable();
            $table->string('permanent_city')->nullable();
            $table->string('permanent_country')->nullable();
            $table->string('country')->nullable();

            // Guardian Info
            $table->string('guardian_name')->nullable();
            $table->string('guardian_membership')->nullable();

            // Membership Dates
            $table->date('membership_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('from_date')->nullable();
            $table->date('to_date')->nullable();

            // Card Info
            $table->string('card_status')->nullable();
            $table->date('card_issue_date')->nullable();
            $table->date('card_expiry_date')->nullable();

            // Status
            $table->string('status')->default('active');
            $table->string('state')->nullable();
            $table->string('reason')->nullable();
            $table->text('active_remarks')->nullable();
            $table->text('name_comments')->nullable();

            // Media
            $table->string('picture')->nullable();
            $table->string('member_image')->nullable();
            $table->string('qr_code')->nullable();

            // Documents
            $table->boolean('is_document_missing')->default(false);
            $table->json('missing_documents')->nullable();

            // Financial
            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->unsignedBigInteger('coa_category_id')->nullable();
            $table->unsignedBigInteger('classification_id')->nullable();  // No FK as classifications table may not exist

            // Expiry Extension
            $table->unsignedBigInteger('expiry_extended_by')->nullable();
            $table->datetime('expiry_extension_date')->nullable();
            $table->text('expiry_extension_reason')->nullable();
            $table->boolean('auto_expiry_calculated')->default(false);

            // Fee Fields
            $table->decimal('membership_fee', 15, 2)->nullable();
            $table->decimal('additional_membership_charges', 15, 2)->nullable();
            $table->text('membership_fee_additional_remarks')->nullable();
            $table->decimal('membership_fee_discount', 15, 2)->nullable();
            $table->text('membership_fee_discount_remarks')->nullable();
            $table->decimal('total_membership_fee', 15, 2)->nullable();

            $table->decimal('maintenance_fee', 15, 2)->nullable();
            $table->decimal('additional_maintenance_charges', 15, 2)->nullable();
            $table->text('maintenance_fee_additional_remarks')->nullable();
            $table->decimal('maintenance_fee_discount', 15, 2)->nullable();
            $table->text('maintenance_fee_discount_remarks')->nullable();
            $table->decimal('total_maintenance_fee', 15, 2)->nullable();
            $table->decimal('per_day_maintenance_fee', 15, 2)->nullable();

            // Business Developer
            $table->foreignId('business_developer_id')->nullable()->constrained('employees')->onDelete('set null');

            // Comments
            $table->text('comment_box')->nullable();

            // Audit Fields
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Self-referencing foreign key for parent
            $table->foreign('parent_id')->references('id')->on('corporate_members')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('corporate_members');
    }
};
