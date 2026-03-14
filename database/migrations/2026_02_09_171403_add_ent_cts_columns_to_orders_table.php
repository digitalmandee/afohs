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
        if (!Schema::hasColumn('orders', 'ent_reason')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('ent_reason')->nullable()->after('payment_method');
                $table->text('ent_comment')->nullable()->after('ent_reason');
                $table->text('cts_comment')->nullable()->after('ent_comment');
            });
        }

        if (!Schema::hasColumn('financial_invoices', 'ent_reason')) {
            Schema::table('financial_invoices', function (Blueprint $table) {
                $table->string('ent_reason')->nullable()->after('status');
                $table->text('ent_comment')->nullable()->after('ent_reason');
                $table->text('cts_comment')->nullable()->after('ent_comment');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['ent_reason', 'ent_comment', 'cts_comment']);
        });

        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn(['ent_reason', 'ent_comment', 'cts_comment']);
        });
    }
};
