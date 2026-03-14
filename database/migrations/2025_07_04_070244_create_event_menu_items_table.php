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
        Schema::create('event_menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_menu_id')->constrained('event_menus')->onDelete('cascade');
            $table->string('name')->nullable();
            $table->bigInteger('amount')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_menu_items');
    }
};
