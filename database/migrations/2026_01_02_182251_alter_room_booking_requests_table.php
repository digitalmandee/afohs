<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('room_booking_requests', function (Blueprint $table) {
            $table->foreignId('room_type_id')->nullable()->constrained('room_types');
            $table->text('additional_notes')->nullable();

            // Make existing fields nullable
            $table->unsignedBigInteger('room_id')->nullable()->change();
            $table->unsignedBigInteger('booking_category')->nullable()->change();
            $table->integer('persons')->nullable()->change();
            $table->decimal('security_deposit', 10, 2)->nullable()->change();
            $table->decimal('per_day_charge', 10, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('room_booking_requests', function (Blueprint $table) {
            $table->dropForeign(['room_type_id']);
            $table->dropColumn(['room_type_id', 'additional_notes']);

            // Revert changes (assuming they were not nullable before)
            // Note: This might fail if there are null values
            $table->unsignedBigInteger('room_id')->nullable(false)->change();
            $table->unsignedBigInteger('booking_category')->nullable(false)->change();
            $table->integer('persons')->nullable(false)->change();
            $table->decimal('security_deposit', 10, 2)->nullable(true)->change();  // It was nullable in original code
            $table->decimal('per_day_charge', 10, 2)->nullable(false)->change();
        });
    }
};
