<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_posting_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('queue_id')->nullable()->constrained('accounting_event_queues')->nullOnDelete();
            $table->string('event_type', 64);
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->enum('status', ['posted', 'failed', 'skipped']);
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->text('message')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();

            $table->index(['status', 'event_type']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_posting_logs');
    }
};
