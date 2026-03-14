<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('transaction_relations', function (Blueprint $table) {
            $table->unsignedBigInteger('legacy_transaction_id')->nullable()->index()->after('amount');
        });
    }

    public function down()
    {
        Schema::table('transaction_relations', function (Blueprint $table) {
            $table->dropColumn('legacy_transaction_id');
        });
    }
};
