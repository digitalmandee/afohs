<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Get list of existing foreign keys
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'subscriptions' 
            AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        ");
        
        $foreignKeyNames = array_map(function($fk) {
            return $fk->CONSTRAINT_NAME;
        }, $foreignKeys);
        
        // Drop foreign keys only if they exist
        Schema::table('subscriptions', function (Blueprint $table) use ($foreignKeyNames) {
            foreach ($foreignKeyNames as $fkName) {
                if (str_contains($fkName, 'user_id') || str_contains($fkName, 'invoice_id')) {
                    $table->dropForeign($fkName);
                }
            }
        });
        
        // Drop old columns
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'user_id')) {
                $table->dropColumn('user_id');
            }
            if (Schema::hasColumn('subscriptions', 'invoice_id')) {
                $table->dropColumn('invoice_id');
            }
            if (Schema::hasColumn('subscriptions', 'category')) {
                $table->dropColumn('category');
            }
            if (Schema::hasColumn('subscriptions', 'subscription_type')) {
                $table->dropColumn('subscription_type');
            }
            if (Schema::hasColumn('subscriptions', 'start_date')) {
                $table->dropColumn('start_date');
            }
            if (Schema::hasColumn('subscriptions', 'expiry_date')) {
                $table->dropColumn('expiry_date');
            }
            
            // Add new columns
            if (!Schema::hasColumn('subscriptions', 'member_id')) {
                $table->foreignId('member_id')->after('id')->constrained('members')->onDelete('cascade');
            }
            if (!Schema::hasColumn('subscriptions', 'subscription_category_id')) {
                $table->foreignId('subscription_category_id')->after('member_id')->constrained('subscription_categories')->onDelete('cascade');
            }
            if (!Schema::hasColumn('subscriptions', 'subscription_type_id')) {
                $table->foreignId('subscription_type_id')->after('subscription_category_id')->constrained('subscription_types')->onDelete('cascade');
            }
            if (!Schema::hasColumn('subscriptions', 'valid_from')) {
                $table->date('valid_from')->after('subscription_type_id')->nullable();
            }
            if (!Schema::hasColumn('subscriptions', 'valid_to')) {
                $table->date('valid_to')->after('valid_from')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('subscriptions', function (Blueprint $table) {
            // Drop new columns
            if (Schema::hasColumn('subscriptions', 'member_id')) {
                $table->dropForeign(['member_id']);
                $table->dropColumn('member_id');
            }
            if (Schema::hasColumn('subscriptions', 'subscription_category_id')) {
                $table->dropForeign(['subscription_category_id']);
                $table->dropColumn('subscription_category_id');
            }
            if (Schema::hasColumn('subscriptions', 'subscription_type_id')) {
                $table->dropForeign(['subscription_type_id']);
                $table->dropColumn('subscription_type_id');
            }
            if (Schema::hasColumn('subscriptions', 'valid_from')) {
                $table->dropColumn('valid_from');
            }
            if (Schema::hasColumn('subscriptions', 'valid_to')) {
                $table->dropColumn('valid_to');
            }
            
            // Restore old columns
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('invoice_id')->constrained('financial_invoices')->onDelete('cascade');
            $table->json('category')->nullable();
            $table->string('subscription_type')->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiry_date')->nullable();
        });
    }
};
