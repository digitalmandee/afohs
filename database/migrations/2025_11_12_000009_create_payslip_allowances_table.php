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
        Schema::create('payslip_allowances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payslip_id')->constrained('payslips')->onDelete('cascade');
            $table->foreignId('allowance_type_id')->constrained('allowance_types')->onDelete('cascade');
            $table->string('allowance_name');
            $table->decimal('amount', 10, 2);
            $table->boolean('is_taxable')->default(true);
            $table->timestamps();

            $table->index('payslip_id');
            $table->index('allowance_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslip_allowances');
    }
};
