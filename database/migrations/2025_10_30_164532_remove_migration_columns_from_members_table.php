<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'migration_source')) {
                $table->dropColumn('migration_source');
            }
            if (Schema::hasColumn('members', 'migration_notes')) {
                $table->dropColumn('migration_notes');
            }
            if (Schema::hasColumn('members', 'migrated_at')) {
                $table->dropColumn('migrated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->string('migration_source')->nullable();
            $table->text('migration_notes')->nullable();
            $table->timestamp('migrated_at')->nullable();
        });
    }
};
