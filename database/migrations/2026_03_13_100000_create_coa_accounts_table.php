<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coa_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('segment1', 4);
            $table->string('segment2', 4)->nullable();
            $table->string('segment3', 4)->nullable();
            $table->string('segment4', 4)->nullable();
            $table->string('full_code', 32)->unique();
            $table->string('name');
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense']);
            $table->unsignedTinyInteger('level');
            $table->foreignId('parent_id')->nullable()->constrained('coa_accounts')->nullOnDelete();
            $table->boolean('is_postable')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index(['type', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coa_accounts');
    }
};
