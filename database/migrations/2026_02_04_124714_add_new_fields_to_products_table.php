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
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_salable')->default(true)->after('description');
            $table->boolean('is_purchasable')->default(true)->after('is_salable');
            $table->boolean('is_returnable')->default(true)->after('is_purchasable');
            $table->boolean('is_taxable')->default(false)->after('is_returnable');

            $table->foreignId('unit_id')->nullable()->constrained('pos_units')->nullOnDelete()->after('is_taxable');
            $table->string('item_type')->default('finished_product')->after('unit_id');  // 'finished_product', 'raw_material'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            //
        });
    }
};
