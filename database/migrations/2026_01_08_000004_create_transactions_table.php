<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();

            // Polymorphic relations (indexes are auto-created)
            $table->nullableMorphs('payable');
            $table->nullableMorphs('reference');

            // Ledger details
            $table->enum('type', ['debit', 'credit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance', 15, 2)->nullable();

            // Categorization
            $table
                ->foreignId('trans_type_id')
                ->nullable()
                ->constrained('transaction_types')
                ->nullOnDelete();

            $table->text('description')->nullable();
            $table->string('remarks')->nullable();
            $table->date('date')->useCurrent();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transactions');
    }
};
