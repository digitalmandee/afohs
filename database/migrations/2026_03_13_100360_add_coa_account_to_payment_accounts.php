<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_accounts', function (Blueprint $table) {
            $table->foreignId('coa_account_id')->nullable()->after('payment_method')->constrained('coa_accounts')->nullOnDelete();
            $table->boolean('is_default')->default(false)->after('coa_account_id');
        });
    }

    public function down(): void
    {
        Schema::table('payment_accounts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('coa_account_id');
            $table->dropColumn('is_default');
        });
    }
};
