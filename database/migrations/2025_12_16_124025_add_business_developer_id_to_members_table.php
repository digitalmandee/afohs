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
        Schema::table('members', function (Blueprint $table) {
            $table->foreignId('business_developer_id')->nullable()->constrained('employees');
            // Assuming business developers are users. If they are employees, check the table name.
            // Based on code: route('employees.business-developers') suggests they might be employees or users.
            // AddForm4 uses: getOptionLabel={(option) => `${option.name} (${option.employee_id})`}
            // Let's check relation in Member model if possible, but safe bet is nullable integer first if unsure about constraint.
            // However, typical Laravel convention: constrained without table name assumes 'business_developers' table.
            // The code uses `businessDeveloper` relationship. Let's peek at Member model to be sure about the relation.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            $table->dropForeign(['business_developer_id']);
            $table->dropColumn('business_developer_id');
        });
    }
};
