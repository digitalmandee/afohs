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
        Schema::create('member_profession_infos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');

            // Nomination
            $table->string('nominee_name')->nullable();
            $table->string('nominee_relation')->nullable();
            $table->string('nominee_contact')->nullable();

            // Profession
            $table->string('occupation')->nullable();
            $table->string('designation')->nullable();
            $table->string('organization')->nullable();
            $table->string('experience')->nullable();

            // Application History
            $table->boolean('applied_before')->default(false);
            $table->string('applied_date')->nullable();
            $table->string('application_status')->nullable();  // Approved / Rejected
            $table->text('rejection_reason')->nullable();

            // Referral
            $table->string('referral_member_name')->nullable();
            $table->string('referral_membership_no')->nullable();
            $table->string('referral_relation')->nullable();
            $table->string('referral_contact')->nullable();

            // Affiliations
            $table->boolean('foreign_affiliation')->default(false);
            $table->string('foreign_org_name')->nullable();
            $table->string('foreign_affiliation_period')->nullable();

            // Other Clubs (JSON for multiple entries)
            $table->json('other_club_membership')->nullable();
            $table->text('club_termination_details')->nullable();

            // Political & Other
            $table->text('political_affiliation')->nullable();
            $table->text('relatives_armed_forces')->nullable();
            $table->text('relatives_civil_services')->nullable();

            $table->boolean('stayed_abroad')->default(false);
            $table->text('stayed_abroad_details')->nullable();

            $table->boolean('criminal_conviction')->default(false);
            $table->text('criminal_details')->nullable();

            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('member_profession_infos');
    }
};
