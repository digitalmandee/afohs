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
        Schema::table('transaction_relations', function (Blueprint $table) {
            if (!Schema::hasColumn('transaction_relations', 'legacy_transaction_id')) {
                $table->unsignedBigInteger('legacy_transaction_id')->nullable()->after('amount');
            }
            // Make receipt_id nullable if it exists
            if (Schema::hasColumn('transaction_relations', 'receipt_id')) {
                $table->unsignedBigInteger('receipt_id')->nullable()->change();
            }
            if (!Schema::hasColumn('transaction_relations', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('updated_at');
            }
            if (!Schema::hasColumn('transaction_relations', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('transaction_relations', 'deleted_by')) {
                $table->unsignedBigInteger('deleted_by')->nullable()->after('updated_by');
            }
            if (!Schema::hasColumn('transaction_relations', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_relations', function (Blueprint $table) {
            $table->dropColumn(['legacy_transaction_id', 'created_by', 'updated_by', 'deleted_by', 'deleted_at']);
            $table->unsignedBigInteger('receipt_id')->nullable(false)->change();
        });
    }
};
