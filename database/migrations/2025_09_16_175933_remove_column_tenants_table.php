<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // 🔽 remove unwanted columns here
            $table->dropColumn([
                'email',
                'password',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // 🔽 add them back if needed (define the type again)
            $table->string('email')->nullable();
            $table->string('password')->nullable();
        });
    }
};
