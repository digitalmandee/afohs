<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('products', 'uses_recipe') || !Schema::hasColumn('products', 'recipe_yield_percent')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'uses_recipe')) {
                    $table->boolean('uses_recipe')->default(false)->after('manage_stock');
                }
                if (!Schema::hasColumn('products', 'recipe_yield_percent')) {
                    $table->decimal('recipe_yield_percent', 5, 2)->default(100)->after('uses_recipe');
                }
            });
        }

        if (!Schema::hasTable('product_variant_value_ingredients')) {
            Schema::create('product_variant_value_ingredients', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_variant_value_id');
                $table->unsignedBigInteger('ingredient_id');
                $table->decimal('quantity_used', 10, 3);
                $table->decimal('cost', 10, 2)->nullable();
                $table->timestamps();

                $table->unique(['product_variant_value_id', 'ingredient_id'], 'product_variant_value_ingredient_unique');
                $table->foreign('product_variant_value_id', 'pvvi_variant_value_fk')
                    ->references('id')
                    ->on('product_variant_values')
                    ->cascadeOnDelete();
                $table->foreign('ingredient_id', 'pvvi_ingredient_fk')
                    ->references('id')
                    ->on('ingredients')
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variant_value_ingredients');

        if (Schema::hasColumn('products', 'uses_recipe') || Schema::hasColumn('products', 'recipe_yield_percent')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'uses_recipe')) {
                    $table->dropColumn('uses_recipe');
                }
                if (Schema::hasColumn('products', 'recipe_yield_percent')) {
                    $table->dropColumn('recipe_yield_percent');
                }
            });
        }
    }
};
