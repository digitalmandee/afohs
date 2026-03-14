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
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('menu_code')->nullable();
            $table->longText('description')->nullable();
            $table->json('images')->nullable();

            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();

            $table->decimal('base_price', 10, 2);
            $table->decimal('cost_of_goods_sold', 10, 2);

            $table->unsignedInteger('current_stock')->default(0);
            $table->unsignedInteger('minimal_stock')->default(0);
            $table->boolean('notify_when_out_of_stock')->default(false);

            $table->json('available_order_types')->nullable();

            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};