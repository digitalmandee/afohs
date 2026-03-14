<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAppliedMemberTable extends Migration
{
    public function up()
    {
        Schema::create('applied_member', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('member_id')->nullable()->unique();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone_number')->nullable();
            $table->text('address')->nullable();
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->string('cnic')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->boolean('is_permanent_member')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('applied_member');
    }
}
