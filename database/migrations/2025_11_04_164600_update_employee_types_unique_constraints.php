<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateEmployeeTypesUniqueConstraints extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('employee_types', function (Blueprint $table) {
            // Drop existing unique constraints
            $table->dropUnique(['name']);
            $table->dropUnique(['slug']);
            
            // Add composite unique constraints that include deleted_at
            // This allows same name/slug for deleted records
            $table->unique(['name', 'deleted_at']);
            $table->unique(['slug', 'deleted_at']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('employee_types', function (Blueprint $table) {
            // Drop composite unique constraints
            $table->dropUnique(['name', 'deleted_at']);
            $table->dropUnique(['slug', 'deleted_at']);
            
            // Restore original unique constraints
            $table->unique('name');
            $table->unique('slug');
        });
    }
}
