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
        Schema::create('employee_assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('classification');  // e.g., IT, Furniture
            $table->string('type');  // e.g., Laptop, Car
            $table->date('acquisition_date')->nullable();
            $table->string('location')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('cost', 10, 2)->nullable();
            $table->string('status')->default('active');  // e.g., active, retired
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_assets');
    }
};
