<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_event_queues', function (Blueprint $table) {
            $table->id();
            $table->string('event_type', 64);
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->string('idempotency_key')->unique();
            $table->enum('status', ['pending', 'processing', 'posted', 'failed', 'skipped'])->default('pending');
            $table->json('payload')->nullable();
            $table->unsignedInteger('retry_count')->default(0);
            $table->timestamp('last_attempt_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'event_type']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_event_queues');
    }
};
