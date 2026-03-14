<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('transaction_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['debit', 'credit', 'both'])->default('debit');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_system')->default(false);  // To protect core types
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transaction_types');
    }
};
