<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operational_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('correlation_id', 100)->nullable();
            $table->string('module', 40);
            $table->string('entity_type', 120)->nullable();
            $table->string('entity_id', 120)->nullable();
            $table->string('action', 180);
            $table->string('status', 40);
            $table->string('severity', 20)->default('info');
            $table->text('message');
            $table->json('context_json')->nullable();
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('request_path', 255)->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('error_signature', 64)->nullable();
            $table->timestamps();

            $table->index(['module', 'created_at'], 'op_audit_module_created_idx');
            $table->index(['entity_type', 'entity_id'], 'op_audit_entity_idx');
            $table->index('correlation_id', 'op_audit_correlation_idx');
            $table->index(['status', 'severity'], 'op_audit_status_severity_idx');
            $table->index('error_signature', 'op_audit_signature_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operational_audit_logs');
    }
};

