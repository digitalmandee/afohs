<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Normalize 'member' -> App\Models\Member
        DB::table('transactions')
            ->where('payable_type', 'member')
            ->update(['payable_type' => 'App\Models\Member']);

        // Normalize 'corporate_member' -> App\Models\CorporateMember
        DB::table('transactions')
            ->where('payable_type', 'corporate_member')
            ->update(['payable_type' => 'App\Models\CorporateMember']);

        // Normalize 'customer' -> App\Models\Customer
        DB::table('transactions')
            ->where('payable_type', 'customer')
            ->update(['payable_type' => 'App\Models\Customer']);

        // Also check Receipts just in case
        DB::table('financial_receipts')
            ->where('payer_type', 'member')
            ->update(['payer_type' => 'App\Models\Member']);

        DB::table('financial_receipts')
            ->where('payer_type', 'corporate_member')
            ->update(['payer_type' => 'App\Models\CorporateMember']);

        DB::table('financial_receipts')
            ->where('payer_type', 'customer')
            ->update(['payer_type' => 'App\Models\Customer']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No revert needed for normalization
    }
};
