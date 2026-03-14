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
            $table->unsignedBigInteger('expiry_extended_by')->nullable()->after('deleted_by');
            $table->timestamp('expiry_extension_date')->nullable()->after('expiry_extended_by');
            $table->text('expiry_extension_reason')->nullable()->after('expiry_extension_date');
            $table->boolean('auto_expiry_calculated')->default(false)->after('expiry_extension_reason');
            
            // Add foreign key constraint
            $table->foreign('expiry_extended_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['expiry_extended_by']);
            $table->dropColumn([
                'expiry_extended_by',
                'expiry_extension_date',
                'expiry_extension_reason',
                'auto_expiry_calculated'
            ]);
        });
    }
};
