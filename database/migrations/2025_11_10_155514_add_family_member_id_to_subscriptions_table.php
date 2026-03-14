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
        Schema::table('subscriptions', function (Blueprint $table) {

            $table->unsignedBigInteger('member_id')->nullable();

            $table->unsignedBigInteger('family_member_id')->nullable()->after('member_id');

            // Add foreign key constraint
            $table->foreign('family_member_id')->references('id')->on('members')->onDelete('set null');

            // Add index for better query performance
            $table->index(['member_id', 'family_member_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['family_member_id']);
            $table->dropIndex(['member_id', 'family_member_id']);
            $table->dropColumn('family_member_id');
        });
    }
};
