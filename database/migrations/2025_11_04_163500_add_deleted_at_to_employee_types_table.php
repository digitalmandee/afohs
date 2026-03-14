<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddDeletedAtToEmployeeTypesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('employee_types', function (Blueprint $table) {
            if (!Schema::hasColumn('employee_types', 'deleted_at')) {
                $table->softDeletes();
            }
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
            if (Schema::hasColumn('employee_types', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
}
