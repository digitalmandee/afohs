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
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('total_quantity', 10, 2); // Total grams/quantity available
            $table->decimal('used_quantity', 10, 2)->default(0); // Used grams/quantity
            $table->decimal('remaining_quantity', 10, 2); // Remaining grams/quantity
            $table->string('unit')->default('grams'); // Unit of measurement (grams, kg, liters, etc.)
            $table->decimal('cost_per_unit', 10, 2)->nullable(); // Cost per gram/unit
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'expired'])->default('active');
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
