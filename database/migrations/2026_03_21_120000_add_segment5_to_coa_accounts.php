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
            $table->string('segment5', 4)->nullable()->after('segment4');
        });

        DB::table('coa_accounts')
            ->select('id', 'segment1', 'segment2', 'segment3', 'segment4', 'segment5', 'full_code', 'level', 'parent_id')
            ->orderBy('id')
            ->chunkById(200, function ($accounts): void {
                foreach ($accounts as $account) {
                    $segments = array_values(array_filter([
                        $account->segment1,
                        $account->segment2,
                        $account->segment3,
                        $account->segment4,
                        $account->segment5,
                    ], fn ($segment) => $segment !== null && $segment !== ''));

                    $payload = [
                        'full_code' => implode('-', $segments),
                        'level' => count($segments),
                    ];

                    DB::table('coa_accounts')
                        ->where('id', $account->id)
                        ->update($payload);
                }
            });
    }

    public function down(): void
    {
        Schema::table('coa_accounts', function (Blueprint $table) {
            $table->dropColumn('segment5');
        });
    }
};
