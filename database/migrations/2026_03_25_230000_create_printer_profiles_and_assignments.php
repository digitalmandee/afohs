<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('printer_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('name');
            $table->string('printer_ip', 255);
            $table->unsignedSmallInteger('printer_port')->default(9100);
            $table->boolean('is_active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'printer_profile_id')) {
                $table->unsignedBigInteger('printer_profile_id')->nullable()->after('printer_port');
            }
        });

        Schema::table('kitchen_details', function (Blueprint $table) {
            if (!Schema::hasColumn('kitchen_details', 'printer_profile_id')) {
                $table->unsignedBigInteger('printer_profile_id')->nullable()->after('printer_port');
            }
        });

        Schema::table('order_print_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('order_print_logs', 'printer_profile_id')) {
                $table->unsignedBigInteger('printer_profile_id')->nullable()->after('kitchen_id');
            }

            if (!Schema::hasColumn('order_print_logs', 'last_attempt_at')) {
                $table->timestamp('last_attempt_at')->nullable()->after('printed_at');
            }
        });

        $this->backfillExistingAssignments();
    }

    public function down(): void
    {
        Schema::table('order_print_logs', function (Blueprint $table) {
            $drop = [];

            foreach (['printer_profile_id', 'last_attempt_at'] as $column) {
                if (Schema::hasColumn('order_print_logs', $column)) {
                    $drop[] = $column;
                }
            }

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });

        Schema::table('kitchen_details', function (Blueprint $table) {
            if (Schema::hasColumn('kitchen_details', 'printer_profile_id')) {
                $table->dropColumn('printer_profile_id');
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'printer_profile_id')) {
                $table->dropColumn('printer_profile_id');
            }
        });

        Schema::dropIfExists('printer_profiles');
    }

    protected function backfillExistingAssignments(): void
    {
        $now = now();
        $profiles = [];

        $findOrCreateProfile = function (?int $tenantId, string $name, string $ip, int $port) use (&$profiles, $now): int {
            $key = implode('|', [$tenantId ?: 0, $ip, $port]);
            if (isset($profiles[$key])) {
                return $profiles[$key];
            }

            $existingId = DB::table('printer_profiles')
                ->where('tenant_id', $tenantId)
                ->where('printer_ip', $ip)
                ->where('printer_port', $port)
                ->value('id');

            if ($existingId) {
                return $profiles[$key] = (int) $existingId;
            }

            $id = DB::table('printer_profiles')->insertGetId([
                'tenant_id' => $tenantId,
                'name' => $name,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'is_active' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            return $profiles[$key] = (int) $id;
        };

        DB::table('tenants')
            ->select('id', 'name', 'printer_ip', 'printer_port')
            ->whereNotNull('printer_ip')
            ->orderBy('id')
            ->get()
            ->each(function ($tenant) use ($findOrCreateProfile) {
                $profileId = $findOrCreateProfile(
                    (int) $tenant->id,
                    trim(($tenant->name ?: 'Restaurant') . ' Receipt Printer'),
                    (string) $tenant->printer_ip,
                    (int) ($tenant->printer_port ?: 9100)
                );

                DB::table('tenants')
                    ->where('id', $tenant->id)
                    ->update(['printer_profile_id' => $profileId]);
            });

        if (!Schema::hasTable('users') || !Schema::hasTable('kitchen_details')) {
            return;
        }

        DB::table('kitchen_details as kd')
            ->join('users as u', 'u.id', '=', 'kd.kitchen_id')
            ->select('kd.id', 'kd.printer_ip', 'kd.printer_port', 'u.name')
            ->whereNotNull('kd.printer_ip')
            ->orderBy('kd.id')
            ->get()
            ->each(function ($row) use ($findOrCreateProfile) {
                $profileId = $findOrCreateProfile(
                    null,
                    trim(($row->name ?: 'Kitchen') . ' Printer'),
                    (string) $row->printer_ip,
                    (int) ($row->printer_port ?: 9100)
                );

                DB::table('kitchen_details')
                    ->where('id', $row->id)
                    ->update(['printer_profile_id' => $profileId]);
            });
    }
};
