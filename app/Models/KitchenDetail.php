<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class KitchenDetail extends Model
{
    use HasFactory;

    protected $fillable = ['kitchen_id', 'printer_ip', 'printer_port', 'printer_profile_id', 'printer_source', 'printer_name', 'printer_connector'];
}
