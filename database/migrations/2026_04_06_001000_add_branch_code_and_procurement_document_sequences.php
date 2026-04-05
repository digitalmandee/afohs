<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'branch_code')) {
                $table->string('branch_code', 20)->nullable()->after('name');
                $table->unique('branch_code', 'branches_branch_code_unique');
            }
        });

        if (!Schema::hasTable('procurement_document_sequences')) {
            Schema::create('procurement_document_sequences', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->string('document_type', 10);
                $table->string('period_ym', 4);
                $table->unsignedInteger('last_number')->default(0);
                $table->timestamps();

                $table->unique(['branch_id', 'document_type', 'period_ym'], 'proc_doc_seq_unique');
                $table->index(['document_type', 'period_ym'], 'proc_doc_seq_type_period_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('procurement_document_sequences')) {
            Schema::dropIfExists('procurement_document_sequences');
        }

        Schema::table('branches', function (Blueprint $table) {
            if (Schema::hasColumn('branches', 'branch_code')) {
                $table->dropUnique('branches_branch_code_unique');
                $table->dropColumn('branch_code');
            }
        });
    }
};

