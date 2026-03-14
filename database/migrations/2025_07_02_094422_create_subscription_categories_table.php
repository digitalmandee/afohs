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
        Schema::create('subscription_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('subscription_type_id')->nullable()->constrained('subscription_types')->onDelete('set null');
            $table->string('description')->nullable();
            $table->bigInteger('fee')->default(0);
            $table->bigInteger('subscription_fee')->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_categories');
    }
};