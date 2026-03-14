<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /** Run the migrations. */

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create Designations Table
        if (!Schema::hasTable('designations')) {
            Schema::create('designations', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->text('description')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');

                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();

                $table->softDeletes();
                $table->timestamps();
            });
        }

        // 2. Add designation_id to Employees
        if (!Schema::hasColumn('employees', 'designation_id')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->foreignId('designation_id')->nullable()->after('designation')->constrained('designations')->nullOnDelete();
            });
        }

        // 3. Data Migration: Move strings to Designations table
        $employees = DB::table('employees')->select('id', 'designation')->whereNotNull('designation')->where('designation', '!=', '')->get();
        $designationMap = [];

        foreach ($employees as $employee) {
            $designationName = trim($employee->designation);
            if (empty($designationName))
                continue;

            if (!isset($designationMap[$designationName])) {
                $id = null;
                $existing = DB::table('designations')->where('name', $designationName)->first();

                if ($existing) {
                    $id = $existing->id;
                } else {
                    try {
                        $id = DB::table('designations')->insertGetId([
                            'name' => $designationName,
                            'status' => 'active',
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } catch (\Exception $e) {
                        // Fallback if concurrency or case sensitivity causes duplicate error
                        $id = DB::table('designations')->where('name', $designationName)->value('id');
                    }
                }
                $designationMap[$designationName] = $id;
            }

            DB::table('employees')->where('id', $employee->id)->update([
                'designation_id' => $designationMap[$designationName]
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert is tricky for data, but we can drop the column and table
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['designation_id']);
            $table->dropColumn('designation_id');
        });

        Schema::dropIfExists('designations');
    }
};
