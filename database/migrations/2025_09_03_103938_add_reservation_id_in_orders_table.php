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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'reservation_id')) {
                $table->unsignedBigInteger('reservation_id')->nullable()->after('id');
                $table->foreign('reservation_id')->references('id')->on('reservations')->onDelete('set null');
            }

            if (Schema::hasColumn('orders', 'order_number')) {
                try {
                    $table->dropUnique('orders_order_number_unique');
                } catch (\Throwable $e) {
                }

                $table->dropColumn('order_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
            $table->dropColumn('reservation_id');
            $table->string('order_number')->after('id');
        });
    }
};
