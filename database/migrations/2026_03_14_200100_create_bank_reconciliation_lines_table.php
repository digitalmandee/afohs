<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_reconciliation_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('bank_reconciliation_sessions')->cascadeOnDelete();
            $table->date('txn_date');
            $table->string('reference_no')->nullable();
            $table->string('description')->nullable();
            $table->enum('direction', ['inflow', 'outflow']);
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['unmatched', 'matched', 'adjustment'])->default('unmatched');
            $table->string('matched_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'status'], 'bank_recon_line_status_idx');
            $table->index(['txn_date', 'amount'], 'bank_recon_line_date_amount_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliation_lines');
    }
};
