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
        Schema::create('media', function (Blueprint $table) {
            // Primary Key
            $table->id();

            // Polymorphic Relationship (replaces old trans_type + trans_type_id)
            $table->morphs('mediable'); // Creates: mediable_type (string), mediable_id (bigint)

            // File Information
            $table->string('type'); // Document type: 'profile_photo', 'cnic', 'passport', etc.
            $table->string('file_name'); // Original filename
            $table->string('file_path'); // Storage path (replaces old 'url' field)
            $table->string('mime_type')->nullable(); // image/jpeg, application/pdf, etc.
            $table->unsignedBigInteger('file_size')->nullable(); // Size in bytes
            $table->string('disk')->default('public'); // Storage disk (public, s3, etc.)

            // Additional Metadata
            $table->json('custom_properties')->nullable(); // Extra metadata if needed
            $table->string('description')->nullable(); // Document description/notes
            $table->timestamp('expires_at')->nullable(); // For documents with expiry (ID cards, passports, etc.)

            // Audit Trail (from old structure)
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();

            // Timestamps
            $table->timestamps(); // created_at, updated_at
            $table->softDeletes(); // deleted_at

            // Indexes for performance
            $table->index(['mediable_type', 'mediable_id'], 'media_mediable_index');
            $table->index('type');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
