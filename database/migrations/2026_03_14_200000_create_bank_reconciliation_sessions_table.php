<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_reconciliation_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_account_id')->constrained('payment_accounts')->restrictOnDelete();
            $table->date('statement_start_date');
            $table->date('statement_end_date');
            $table->decimal('statement_opening_balance', 15, 2)->default(0);
            $table->decimal('statement_closing_balance', 15, 2)->default(0);
            $table->decimal('book_opening_balance', 15, 2)->default(0);
            $table->decimal('book_closing_balance', 15, 2)->default(0);
            $table->decimal('difference_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'reconciled', 'locked'])->default('draft');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reconciled_at')->nullable();
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['payment_account_id', 'statement_start_date', 'statement_end_date'], 'bank_recon_session_period_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliation_sessions');
    }
};
