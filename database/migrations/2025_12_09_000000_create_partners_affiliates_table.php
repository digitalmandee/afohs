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
        Schema::create('partners_affiliates', function (Blueprint $table) {
            $table->id();

            // Partner / Affiliate Information
            $table->string('type')->comment('Partner or Affiliate');
            $table->string('organization_name');
            $table->text('facilitation_details')->nullable();
            $table->text('address');
            $table->string('telephone');
            $table->string('mobile_a');
            $table->string('mobile_b')->nullable();
            $table->string('email');
            $table->string('website')->nullable();

            // Focal Person Information
            $table->string('focal_person_name');
            $table->string('focal_mobile_a');
            $table->string('focal_mobile_b')->nullable();
            $table->string('focal_telephone')->nullable();
            $table->string('focal_email');

            // Agreement Information (Document handles via Media table)
            $table->date('agreement_date');
            $table->string('status')->default('Active');
            $table->text('comments')->nullable();

            // Tracking Columns
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partners_affiliates');
    }
};
