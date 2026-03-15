<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_no')->unique();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->enum('type', ['opening_balance', 'adjustment', 'transfer']);
            $table->foreignId('source_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->unsignedBigInteger('source_warehouse_location_id')->nullable();
            $table->foreignId('destination_warehouse_id')->nullable()->constrained('warehouses')->nullOnDelete();
            $table->unsignedBigInteger('destination_warehouse_location_id')->nullable();
            $table->date('transaction_date');
            $table->string('status', 30)->default('posted');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'type', 'transaction_date'], 'inv_docs_tenant_type_date_idx');
            $table->index(['source_warehouse_id', 'destination_warehouse_id'], 'inv_docs_wh_pair_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_documents');
    }
};
