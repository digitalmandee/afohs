<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /** Run the migrations. */

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            // Drop foreign key if it exists
            $table->dropForeign(['employee_type_id']);
            // Drop the column
            $table->dropColumn('employee_type_id');
        });

        Schema::dropIfExists('employee_types');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('employee_types')) {
            Schema::create('employee_types', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('slug')->unique();
                $table->bigInteger('created_by')->nullable();
                $table->bigInteger('updated_by')->nullable();
                $table->bigInteger('deleted_by')->nullable();
                $table->timestamps();
            });
        }

        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'employee_type_id')) {
                $table->unsignedBigInteger('employee_type_id')->nullable()->after('department_id');
                $table->foreign('employee_type_id')->references('id')->on('employee_types')->onDelete('set null');
            }
        });
    }
};
