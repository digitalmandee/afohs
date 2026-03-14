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
        if (!Schema::hasColumn('members', 'application_no')) {
            return;
        }

        $driver = DB::getDriverName();
        $indexName = 'members_application_no_unique';

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('members')");
            $hasIndex = collect($indexes)->contains(fn ($idx) => ($idx->name ?? null) === $indexName);

            if ($hasIndex) {
                DB::statement("DROP INDEX {$indexName}");
            }
        } elseif ($driver === 'mysql') {
            $indexes = DB::select("
                SELECT INDEX_NAME
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = 'members'
                  AND index_name = ?
                LIMIT 1
            ", [$indexName]);

            if (!empty($indexes)) {
                DB::statement("DROP INDEX `{$indexName}` ON `members`");
            }
        }

        Schema::table('members', function (Blueprint $table) {
            $table->dropColumn('application_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            if (!Schema::hasColumn('members', 'application_no')) {
                $table->bigInteger('application_no')->unique()->nullable();
            }
        });
    }
};
