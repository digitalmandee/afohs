<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coa_accounts', function (Blueprint $table) {
            $table->enum('normal_balance', ['debit', 'credit'])->default('debit')->after('type');
            $table->decimal('opening_balance', 15, 2)->default(0)->after('parent_id');
            $table->text('description')->nullable()->after('opening_balance');
        });

        DB::table('coa_accounts')
            ->select('id', 'type')
            ->orderBy('id')
            ->chunkById(200, function ($accounts): void {
                foreach ($accounts as $account) {
                    $normalBalance = in_array($account->type, ['liability', 'equity', 'income'], true) ? 'credit' : 'debit';

                    DB::table('coa_accounts')
                        ->where('id', $account->id)
                        ->update(['normal_balance' => $normalBalance]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('coa_accounts', function (Blueprint $table) {
            $table->dropColumn(['normal_balance', 'opening_balance', 'description']);
        });
    }
};
