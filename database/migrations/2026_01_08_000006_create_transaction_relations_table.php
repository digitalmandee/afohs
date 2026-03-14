<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('transaction_relations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('financial_invoices')->onDelete('cascade');
            $table->foreignId('receipt_id')->constrained('financial_receipts')->onDelete('cascade');
            $table->decimal('amount', 15, 2);  // Amount allocated
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaction_relations');
    }
};
