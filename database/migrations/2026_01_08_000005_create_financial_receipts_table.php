<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('financial_receipts', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_no')->unique();

            // Payer (Member, Guest, etc.)
            $table->nullableMorphs('payer');

            $table->decimal('amount', 15, 2);
            $table->string('payment_method')->default('cash');  // cash, cheque, bank_transfer, card
            $table->text('payment_details')->nullable();  // bank name, cheque number, auth code

            $table->date('receipt_date')->useCurrent();
            $table->text('remarks')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('financial_receipts');
    }
};
