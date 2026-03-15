<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('journal_notification_deliveries')) {
            Schema::create('journal_notification_deliveries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('channel', 32);
                $table->string('recipient')->nullable();
                $table->enum('status', ['sent', 'failed'])->default('sent');
                $table->text('provider_response')->nullable();
                $table->unsignedSmallInteger('attempts')->default(1);
                $table->timestamp('last_attempt_at')->nullable();
                $table->json('context')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('journal_notification_deliveries', function (Blueprint $table) {
            $table->index(['status', 'channel'], 'jnd_status_channel_idx');
            $table->index(['journal_entry_id', 'created_at'], 'jnd_entry_created_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_notification_deliveries');
    }
};
