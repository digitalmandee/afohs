<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_print_logs', function (Blueprint $table) {
            $table->id();
            $table->string('batch_id', 64)->index();
            $table->unsignedBigInteger('order_id')->index();
            $table->unsignedBigInteger('restaurant_id')->nullable()->index();
            $table->unsignedBigInteger('kitchen_id')->nullable()->index();
            $table->enum('document_type', ['kot', 'bill'])->default('kot')->index();
            $table->enum('status', ['queued', 'sent', 'failed', 'skipped', 'retried'])->default('queued')->index();
            $table->string('queue_name', 64)->nullable();
            $table->string('printer_ip', 255)->nullable();
            $table->unsignedSmallInteger('printer_port')->nullable();
            $table->unsignedInteger('attempt')->default(1);
            $table->text('error')->nullable();
            $table->timestamp('printed_at')->nullable();
            $table->json('meta')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_print_logs');
    }
};

