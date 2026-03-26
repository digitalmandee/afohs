<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_backfill_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('backfill_run_id')->constrained('accounting_backfill_runs')->cascadeOnDelete();
            $table->string('source_family', 64);
            $table->string('source_kind', 32);
            $table->string('source_type');
            $table->unsignedBigInteger('source_id');
            $table->date('source_date')->nullable();
            $table->decimal('source_amount', 15, 2)->default(0);
            $table->string('classification_code', 64)->nullable();
            $table->string('event_type', 64)->nullable();
            $table->string('posting_rule_code', 64)->nullable();
            $table->foreignId('queue_id')->nullable()->constrained('accounting_event_queues')->nullOnDelete();
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->string('status', 32);
            $table->string('reason_code', 64)->nullable();
            $table->text('reason_text')->nullable();
            $table->json('payload')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['backfill_run_id', 'source_type', 'source_id'], 'accounting_backfill_run_source_unique');
            $table->index(['source_family', 'status']);
            $table->index(['source_date']);
            $table->index(['source_type', 'source_id']);
            $table->index(['reason_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_backfill_records');
    }
};
