<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_approval_policies', function (Blueprint $table) {
            $table->id();
            $table->string('module')->unique();
            $table->boolean('is_active')->default(true);
            $table->boolean('enforce_maker_checker')->default(true);
            $table->string('approver_role')->nullable();
            $table->decimal('auto_post_below', 14, 2)->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_approval_policies');
    }
};

