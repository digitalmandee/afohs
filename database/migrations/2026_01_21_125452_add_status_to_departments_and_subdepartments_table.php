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
        Schema::table('departments', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('name');
        });

        Schema::table('subdepartments', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->after('department_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('subdepartments', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
