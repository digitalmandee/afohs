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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('order_number')->unique();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('waiter_id')->nullable()->constrained('users');
            $table->foreignId('table_id')->nullable()->constrained('tables')->nullOnDelete();
            $table->string('order_type')->nullable();
            $table->integer('person_count')->default(0);
            $table->decimal('down_payment', 10, 2)->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->date('start_date')->nullable();
            $table->time('start_time')->nullable();
            $table->dateTime('order_time', 3)->nullable();
            $table->enum('status', ['saved', 'pending', 'in_progress', 'completed', 'cancelled', 'no_show', 'refund'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
