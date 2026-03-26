<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_backfill_runs', function (Blueprint $table) {
            $table->id();
            $table->string('mode', 32);
            $table->json('families');
            $table->json('filters')->nullable();
            $table->unsignedInteger('chunk_size')->default(100);
            $table->boolean('is_commit')->default(false);
            $table->boolean('include_deleted_receipts')->default(false);
            $table->boolean('stop_on_error')->default(false);
            $table->string('status', 32)->default('pending');
            $table->json('summary')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['mode', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_backfill_runs');
    }
};
