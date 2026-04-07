<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('goods_receipts', 'journal_entry_id')) {
                $table->unsignedBigInteger('journal_entry_id')->nullable()->after('posted_at');
                $table->index('journal_entry_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('goods_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('goods_receipts', 'journal_entry_id')) {
                $table->dropIndex(['journal_entry_id']);
                $table->dropColumn('journal_entry_id');
            }
        });
    }
};
