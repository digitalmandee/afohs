<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateMembershipInvoicesTable extends Migration
{
    public function up()
    {
        Schema::create('membership_invoices', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('customer_id')->unsigned()->nullable();
            $table->bigInteger('member_id')->unsigned()->nullable();
            // $table->enum('subscription_type', ['one_time', 'monthly', 'yearly'])->nullable();
            $table->string('subscription_type')->nullable();
            $table->bigInteger('amount')->default(0);
            $table->bigInteger('total_price')->default(0);
            $table->bigInteger('customer_charges')->default(0);
            $table->enum('status', ['paid', 'unpaid', 'cancelled'])->default('unpaid');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('membership_invoices');
    }
}