<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entries', 'posting_unique_key')) {
                $table->string('posting_unique_key', 191)->nullable()->after('module_id');
            }
        });

        DB::statement("
            UPDATE journal_entries je
            INNER JOIN (
                SELECT module_type, module_id
                FROM journal_entries
                WHERE module_type IS NOT NULL
                  AND module_id IS NOT NULL
                GROUP BY module_type, module_id
                HAVING COUNT(*) = 1
            ) uniq
            ON uniq.module_type = je.module_type
           AND uniq.module_id = je.module_id
            SET je.posting_unique_key = CONCAT(je.module_type, '|', je.module_id)
            WHERE je.posting_unique_key IS NULL
        ");

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->unique('posting_unique_key', 'journal_entries_posting_unique_key_unique');
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropUnique('journal_entries_posting_unique_key_unique');
            $table->dropColumn('posting_unique_key');
        });
    }
};
